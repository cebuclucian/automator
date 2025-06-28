import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

// Mock data for admin dashboard
const mockStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalJobs: 3456,
  completedJobs: 2987,
  failedJobs: 123,
  processingJobs: 346,
  revenue: 45670,
  monthlyGrowth: 12.5
};

const mockRecentJobs = [
  {
    id: '1',
    userEmail: 'user1@example.com',
    subject: 'Management de proiect',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    duration: '2h'
  },
  {
    id: '2',
    userEmail: 'user2@example.com',
    subject: 'Marketing digital',
    status: 'processing',
    createdAt: '2024-01-15T09:15:00Z',
    duration: '4h'
  },
  {
    id: '3',
    userEmail: 'user3@example.com',
    subject: 'Leadership și comunicare',
    status: 'failed',
    createdAt: '2024-01-15T08:45:00Z',
    duration: '1h'
  },
  {
    id: '4',
    userEmail: 'user4@example.com',
    subject: 'Vânzări și negociere',
    status: 'completed',
    createdAt: '2024-01-15T07:20:00Z',
    duration: '2h'
  }
];

const mockRecentUsers = [
  {
    id: '1',
    email: 'newuser1@example.com',
    planType: 'pro',
    createdAt: '2024-01-15T11:00:00Z',
    generationsUsed: 2
  },
  {
    id: '2',
    email: 'newuser2@example.com',
    planType: 'basic',
    createdAt: '2024-01-15T10:30:00Z',
    generationsUsed: 1
  },
  {
    id: '3',
    email: 'newuser3@example.com',
    planType: 'enterprise',
    createdAt: '2024-01-15T09:45:00Z',
    generationsUsed: 5
  }
];

export default function AdminDashboardPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(mockStats);
  const [recentJobs, setRecentJobs] = useState(mockRecentJobs);
  const [recentUsers, setRecentUsers] = useState(mockRecentUsers);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completat
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            În progres
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Eșuat
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get plan badge
  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500">Pro</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-500">Enterprise</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Panou de administrare</h1>
              <p className="text-muted-foreground mt-2">
                Monitorizează activitatea platformei și utilizatorii
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/admin/utilizatori">
                  <Users className="mr-2 h-4 w-4" />
                  Utilizatori
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/rapoarte">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Rapoarte
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total utilizatori</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} activi
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursuri generate</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completedJobs} completate
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venituri</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">€{stats.revenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Luna aceasta
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creștere</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
                  <p className="text-xs text-muted-foreground">
                    Față de luna trecută
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Job Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Cursuri completate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {stats.completedJobs}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                În procesare
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {stats.processingJobs}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Eșuate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {stats.failedJobs}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Cursuri recente</CardTitle>
              <CardDescription>
                Ultimele cursuri generate pe platformă
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{job.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.userEmail} • {formatDate(job.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{job.duration}</span>
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Utilizatori noi</CardTitle>
              <CardDescription>
                Ultimii utilizatori înregistrați
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(user.createdAt)} • {user.generationsUsed} cursuri
                        </p>
                      </div>
                      {getPlanBadge(user.planType)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}