import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Users, Upload, Video, FileText, Clock, Terminal, LogOut, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SubmissionForm } from "./SubmissionForm";
import ProblemRenderer from "./ProblemRenderer";
import { generateProblemStatements } from "@/lib/gemini";

const Dashboard = () => {
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    solvedChallenges: 0,
    totalScore: 0,
    currentRank: 0
  });
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates for all tables
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores'
        },
        () => {
          loadLeaderboard();
          loadUserStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'day_problems'
        },
        () => loadChallenges()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          loadChallenges();
          loadUserStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => loadNetworkStatus()
      )
      .subscribe();

    // Load network status periodically
    const networkInterval = setInterval(loadNetworkStatus, 30000); // Every 30 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(networkInterval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadUserProfile(),
        loadChallenges(),
        loadLeaderboard(),
        loadUserStats(),
        loadNetworkStatus()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCanGenerateNext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Check if user has completed all 5 problems
      const { data: problems } = await supabase
        .from('day_problems')
        .select('id')
        .eq('user_id', user.id);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('day_problem_id')
        .eq('user_id', user.id);

      if (problems && submissions) {
        const submittedProblemIds = new Set(submissions.map(s => s.day_problem_id));
        const allProblemsSubmitted = problems.every(p => submittedProblemIds.has(p.id));
        
        // Show button if all 5 problems are submitted and we have exactly 5 problems
        setShowGenerateButton(allProblemsSubmitted && problems.length === 5);
      }
    } catch (error) {
      console.error('Error checking generation eligibility:', error);
    }
  };

  const handleGenerateNext5Days = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsGeneratingNext(true);
    
    try {
      // Get user profile for skills and problem statement
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills, problem_statement')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get existing problems for context
      const { data: existingProblems } = await supabase
        .from('day_problems')
        .select('problem_title, problem_description')
        .eq('user_id', user.id)
        .order('day_number');

      const existingContext = existingProblems || [];

      // Generate 5 new problems
      for (let i = 0; i < 5; i++) {
        const problemData = await generateProblemStatements(
          profile.skills || [],
          profile.problem_statement || '',
          existingContext
        );

        // Calculate challenge date (starting from 6th day)
        const challengeDate = new Date();
        challengeDate.setDate(challengeDate.getDate() + 5 + i); // Start from day 6
        
        const { error } = await supabase
          .from('day_problems')
          .insert({
            user_id: user.id,
            day_number: 6 + i, // Days 6-10
            problem_title: problemData.problem_title,
            problem_description: problemData.problem_description,
            challenge_date: challengeDate.toISOString().split('T')[0],
            is_active: false
          });

        if (error) throw error;

        // Add to context for next generation
        existingContext.push({
          problem_title: problemData.problem_title,
          problem_description: problemData.problem_description
        });
      }

      toast({
        title: "🚀 Next 5 days generated!",
        description: "Advanced challenges are ready for your continued journey",
      });

      // Refresh challenges and hide button
      await loadChallenges();
      setShowGenerateButton(false);
      
    } catch (error) {
      console.error('Error generating next 5 days:', error);
      toast({
        title: "Generation failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(profile);
    }
  };

  const loadChallenges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update active challenge status first
    await updateActiveChallengeStatusInDb(user.id);

    const { data: dayProblems } = await supabase
      .from('day_problems')
      .select('*')
      .eq('user_id', user.id)
      .order('day_number');
    
    if (dayProblems) {
      // Check submissions for each challenge
      const challengesWithStatus = await Promise.all(dayProblems.map(async (problem) => {
        let isSubmitted = false;
        let codeScore = null;
        let videoScore = null;
        
        const { data: submission } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_problem_id', problem.id)
          .maybeSingle();
        
        if (submission) {
          isSubmitted = true;
          // Get scores if available
          const { data: score } = await supabase
            .from('scores')
            .select('code_score, video_score')
            .eq('user_id', user.id)
            .eq('day_problem_id', problem.id)
            .maybeSingle();
          
          if (score) {
            codeScore = score.code_score;
            videoScore = score.video_score;
          }
        }

        // Use the is_active flag from database (updated by updateActiveChallengeStatusInDb)
        const isTodaysChallenge = problem.is_active;
        
        return {
          ...problem,
          isTodaysChallenge,
          isSubmitted,
          codeScore,
          videoScore
        };
      }));
      
      setChallenges(challengesWithStatus);
    }
    checkIfCanGenerateNext();
  };

  const updateActiveChallengeStatusInDb = async (userId: string) => {
    try {
      // Get all user's day problems ordered by day number
      const { data: dayProblems } = await supabase
        .from('day_problems')
        .select('id, day_number, challenge_date')
        .eq('user_id', userId)
        .order('day_number');

      if (!dayProblems) return;

      // Get all submissions for this user
      const { data: submissions } = await supabase
        .from('submissions')
        .select('day_problem_id')
        .eq('user_id', userId);

      const submittedProblemIds = new Set(submissions?.map(s => s.day_problem_id) || []);

      // Find the first unsubmitted problem, or if all are submitted, keep the last one active
      let activeProblems = dayProblems.filter(p => !submittedProblemIds.has(p.id));
      let activeProblemId = activeProblems.length > 0 ? activeProblems[0].id : dayProblems[dayProblems.length - 1]?.id;

      // Set all problems to inactive first
      for (const problem of dayProblems) {
        await supabase
          .from('day_problems')
          .update({ is_active: false })
          .eq('id', problem.id);
      }

      // Set the active problem
      if (activeProblemId) {
        await supabase
          .from('day_problems')
          .update({ is_active: true })
          .eq('id', activeProblemId);
      }
    } catch (error) {
      console.error('Error updating active challenge status:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Get all scores grouped by user
      const { data: scores } = await supabase
        .from('scores')
        .select('user_id, total_score');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (scores && profiles) {
        // Create a map of user_id to name for easy lookup
        const userNames = profiles.reduce((acc, profile) => {
          acc[profile.user_id] = profile.name;
          return acc;
        }, {} as Record<string, string>);

        // Aggregate scores by user
        const userScores = scores.reduce((acc, score) => {
          if (!acc[score.user_id]) {
            acc[score.user_id] = {
              name: userNames[score.user_id] || 'Unknown User',
              totalScore: 0,
              user_id: score.user_id
            };
          }
          acc[score.user_id].totalScore += score.total_score || 0;
          return acc;
        }, {} as Record<string, any>);

        const leaderboardData = Object.values(userScores)
          .sort((a: any, b: any) => b.totalScore - a.totalScore)
          .map((user: any, index) => ({
            name: user.name,
            totalScore: user.totalScore,
            rank: index + 1
          }))
          .slice(0, 10); // Top 10

        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback to placeholder data
      setLeaderboard([
        { name: 'Alex Chen', totalScore: 95, rank: 1 },
        { name: 'Priya Sharma', totalScore: 87, rank: 2 },
        { name: 'Rahul Kumar', totalScore: 82, rank: 3 }
      ]);
    }
  };

  const loadUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get user's total score
      const { data: scores } = await supabase
        .from('scores')
        .select('total_score')
        .eq('user_id', user.id);

      // Get user's total submissions count (this is what we want for "challenges solved")
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', user.id);

      const totalScore = scores?.reduce((sum, score) => sum + (score.total_score || 0), 0) || 0;
      const solvedChallenges = submissions?.length || 0;

      // Get user's rank
      const { data: allScores } = await supabase
        .from('scores')
        .select(`
          user_id,
          total_score
        `);

      if (allScores) {
        const userTotals = allScores.reduce((acc, score) => {
          if (!acc[score.user_id]) acc[score.user_id] = 0;
          acc[score.user_id] += score.total_score || 0;
          return acc;
        }, {} as Record<string, number>);

        const sortedUsers = Object.entries(userTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([userId]) => userId);

        const currentRank = sortedUsers.indexOf(user.id) + 1;

        setUserStats({
          solvedChallenges,
          totalScore,
          currentRank: currentRank > 0 ? currentRank : 0
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadNetworkStatus = async () => {
    try {
      // Get total users count
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get recently active users (logged in within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', oneHourAgo);

      setTotalUsers(totalCount || 0);
      setActiveUsers(activeCount || 0);
    } catch (error) {
      console.error('Error loading network status:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "Session terminated. See you later, SLCIAN!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Terminal className="w-8 h-8 text-accent animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-mono">SIH SLC</h1>
            </div>
            <p className="text-muted-foreground font-mono">
              <span className="text-accent">Day {challenges.find(c => c.isTodaysChallenge)?.day_number || 1}</span> of SIH Protocol • 
              <span className="text-primary ml-2">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </p>
            {userProfile && (
              <p className="text-sm text-accent font-mono mt-1">
                Welcome back, {userProfile.name} // SLCIAN
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 font-mono"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Today's Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-glow hover-lift border-primary/20 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 font-mono">
                      <Calendar className="w-5 h-5 text-accent" />
                      <span className="text-primary">Today's Challenge</span>
                    </CardTitle>
                    <CardDescription className="font-mono">
                      Day {challenges.find(c => c.isTodaysChallenge)?.day_number || 1} • Deadline: 11:59 PM IST
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="animate-pulse font-mono border border-accent/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenges.find(c => c.isTodaysChallenge) ? (() => {
                  const todayChallenge = challenges.find(c => c.isTodaysChallenge);
                  return (
                    <div className="space-y-4">
                      <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
                        <h3 className="text-lg font-semibold text-primary font-mono">
                          {todayChallenge?.problem_title}
                        </h3>
                        <div className="mt-2">
                          <ProblemRenderer 
                            content={todayChallenge?.problem_description || ''} 
                            className="text-muted-foreground text-sm"
                          />
                        </div>
                      </div>
                      
                      {todayChallenge?.isSubmitted ? (
                        <div className="text-center py-4">
                          <p className="text-accent font-mono mb-2">✓ Solution submitted for today!</p>
                          <p className="text-muted-foreground font-mono text-sm">
                            You will receive your result by 11:59 PM IST tonight
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Button 
                              onClick={() => {
                                setSelectedChallenge(todayChallenge?.id);
                                setSubmissionFormOpen(true);
                              }}
                              className="flex items-center space-x-2 font-mono" 
                              variant="neon"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Let's Submit Today's Solution</span>
                            </Button>
                            <div className="group relative">
                              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-mono text-center">
                                  Once you submit, you can't change for today. Use your full time wisely!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground font-mono">// No active challenge for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="shadow-glow border-primary/20 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-mono">
                  <Trophy className="w-5 h-5 text-accent" />
                  <span className="text-primary">Progress Matrix</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                      Challenges Solved
                    </span>
                    <span className="font-semibold text-accent">{userStats.solvedChallenges}/{challenges.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      Total Score
                    </span>
                    <span className="font-semibold text-primary">{userStats.totalScore} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                      Current Rank
                    </span>
                    <span className="font-semibold text-accent">#{userStats.currentRank || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-glow border-primary/20 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-mono">
                  <Users className="w-5 h-5 text-accent" />
                  <span className="text-primary">Network Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3 font-mono text-sm">
                   <div className="flex justify-between items-center">
                     <span className="text-muted-foreground flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                       Connected SLCIANs
                     </span>
                     <span className="font-semibold text-accent">{totalUsers}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-muted-foreground flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                       Active Now
                     </span>
                     <span className="font-semibold text-success">{activeUsers}</span>
                   </div>
                   <div className="text-xs text-muted-foreground mt-3 p-2 rounded bg-card/50 border border-primary/10">
                     <span className="text-accent">System Status:</span> All systems operational
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Challenge History */}
        <Card className="shadow-glow border-primary/20 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-mono">
              <FileText className="w-5 h-5 text-accent" />
              <span className="text-primary">Challenge Archive</span>
            </CardTitle>
            <CardDescription className="font-mono">System log of all challenge protocols</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {challenges.filter(c => !c.isTodaysChallenge || !c.is_active).map((challenge) => {
                // Determine if challenge is in past, future, or inactive today
                const today = new Date();
                const challengeDate = new Date(challenge.challenge_date);
                
                const isPast = challengeDate < today && !challenge.isTodaysChallenge;
                const isFuture = challengeDate > today;
                
                return (
                  <div 
                    key={challenge.id} 
                    className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-neon font-mono ${
                      isPast && challenge.isSubmitted ? 'border-accent/30 bg-accent/5' : 'border-primary/20 bg-background/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant={isPast && challenge.isSubmitted ? "default" : "secondary"} className="font-mono">
                            {challengeDate.toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short'
                            })}
                          </Badge>
                          <h3 className="font-semibold text-primary">{challenge.problem_title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isPast ? (challenge.isSubmitted ? "Completed" : "Missed") : "Upcoming"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {challenge.codeScore !== null && challenge.videoScore !== null && (
                          <>
                            <Badge variant="outline" className="font-mono">Code: {challenge.codeScore}/50</Badge>
                            <Badge variant="outline" className="font-mono">Video: {challenge.videoScore}/50</Badge>
                          </>
                        )}
                        {challenge.isSubmitted && (
                          <Badge variant="default" className="font-mono">Submitted</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {challenges.filter(c => !c.isTodaysChallenge || !c.is_active).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-mono">// No archived challenges available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate Next 5 Days Button */}
        {showGenerateButton && (
          <Card className="shadow-glow border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-mono">
                <Terminal className="w-5 h-5 text-accent" />
                <span className="text-primary">Ready for Advanced Challenges?</span>
              </CardTitle>
              <CardDescription className="font-mono">
                You've completed the initial 5-day preparation cycle. Generate the next level!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateNext5Days}
                disabled={isGeneratingNext}
                className="w-full font-mono"
                variant="neon"
              >
                {isGeneratingNext ? "Generating Advanced Challenges..." : "Generate Next 5 Days"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="shadow-glow border-primary/20 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-mono">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-primary">Global Leaderboard</span>
            </CardTitle>
            <CardDescription className="font-mono">Top SLCIAN performers in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((student, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 transition-colors border border-primary/10 font-mono"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                      index === 0 ? 'bg-accent/20 text-accent border-accent' :
                      index === 1 ? 'bg-primary/20 text-primary border-primary' :
                      index === 2 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400' :
                      'bg-muted/50 text-muted-foreground border-muted'
                    }`}>
                      {student.rank}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">{student.totalScore} pts</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-mono">// No data available</p>
                </div>
              )}
            </div>
          </CardContent>
         </Card>

         {/* Creator Credit */}
         <div className="text-center py-6 border-t border-primary/10">
           <p className="text-muted-foreground font-mono text-sm">
             Creator - <span className="text-primary font-semibold">Rahul Sharma</span>
           </p>
         </div>
       </div>

        {/* Submission Form */}
        {submissionFormOpen && selectedChallenge && (
          <SubmissionForm
            isOpen={submissionFormOpen}
            onClose={() => {
              setSubmissionFormOpen(false);
              setSelectedChallenge(null);
            }}
            problemId={selectedChallenge.toString()}
            problemTitle={challenges.find(c => c.id === selectedChallenge)?.problem_title || ''}
          />
        )}
     </div>
   );
 };
 
 export default Dashboard;