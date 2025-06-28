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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  FileText,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

// Mock data for reports
const mockRevenueData = [
  { month: 'Ian 2024', revenue: 12450, users: 156, courses: 234 },
  { month: 'Feb 2024', revenue: 15670, users: 189, courses: 298 },
  { month: 'Mar 2024', revenue: 18920, users: 223, courses: 367 },
  { month: 'Apr 2024', revenue: 22340, users: 267, courses: 445 },
  { month: 'Mai 2024', revenue: 25680, users: 298, courses: 523 },
  { month: 'Iun 2024', revenue: 28950, users: 334, courses: 612 }
];

const mockTopCourses = [
  { subject: 'Management de proiect', count: 156, percentage: 23.4 },
  { subject: 'Marketing digital', count: 134, percentage: 20.1 },
  { subject: 'Leadership și comunicare', count: 98, percentage: 14.7 },
  { subject: 'Vânzări și negociere', count: 87, percentage: 13.1 },
  { subject: 'Resurse umane', count: 76, percentage: 11.4 },
  { subject: 'Finanțe și contabilitate', count: 65, percentage: 9.8 },
  { subject: 'Dezvoltare personală', count: 51, percentage: 7.6 }
];

const mockUserStats = {
  totalUsers: 1247,
  newUsersThisMonth: 89,
  activeUsers: 892,
  churnRate: 3.2,
  averageSessionTime: '24 min',
  conversionRate: 12.8
};

const mockPlanDistribution = [
  { plan: 'Free', count: 623, percentage: 49.9, revenue: 0 },
  { plan: 'Basic', count: 312, percentage: 25.0, revenue: 5616 },
  { plan: 'Pro', count: 234, percentage: 18.8, revenue: 9126 },
  { plan: 'Enterprise', count: 78, percentage: 6.3, revenue: 10062 }
];

export default function AdminReportsPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get trend icon
  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  // Get plan badge color
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Free':
        return <Badge variant="secondary">Free</Badge>;
      case 'Basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'Pro':
        return <Badge className="bg-blue-500">Pro</Badge>;
      case 'Enterprise':
        return <Badge className="bg-purple-500">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rapoarte și analize</h1>
              <p className="text-muted-foreground mt-2">
                Analizează performanța platformei și tendințele utilizatorilor
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Ultima lună</SelectItem>
                  <SelectItem value="3months">Ultimele 3 luni</SelectItem>
                  <SelectItem value="6months">Ultimele 6 luni</SelectItem>
                  <SelectItem value="1year">Ultimul an</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportă
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venituri totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">€{mockRevenueData[mockRevenueData.length - 1].revenue.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getTrendIcon(15.2)}
                    <span className="ml-1">+15.2% față de luna trecută</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizatori activi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{mockUserStats.activeUsers.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getTrendIcon(8.7)}
                    <span className="ml-1">+8.7% față de luna trecută</span>
                  </div>
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
                  <div className="text-2xl font-bold">{mockRevenueData[mockRevenueData.length - 1].courses.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getTrendIcon(12.3)}
                    <span className="ml-1">+12.3% față de luna trecută</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata de conversie</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{mockUserStats.conversionRate}%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getTrendIcon(2.1)}
                    <span className="ml-1">+2.1% față de luna trecută</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Evoluția veniturilor</CardTitle>
              <CardDescription>
                Venituri lunare în ultimele 6 luni
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {mockRevenueData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{data.month}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.users} utilizatori • {data.courses} cursuri
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">€{data.revenue.toLocaleString()}</p>
                        {index > 0 && (
                          <div className="flex items-center text-xs">
                            {getTrendIcon(parseFloat(calculateGrowth(data.revenue, mockRevenueData[index - 1].revenue)))}
                            <span className="ml-1">
                              {calculateGrowth(data.revenue, mockRevenueData[index - 1].revenue)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuția planurilor</CardTitle>
              <CardDescription>
                Utilizatori pe tipuri de abonament
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {mockPlanDistribution.map((plan) => (
                    <div key={plan.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlanBadge(plan.plan)}
                        <span className="text-sm">{plan.count} utilizatori</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{plan.percentage}%</p>
                        <p className="text-xs text-muted-foreground">
                          €{plan.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Courses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cursuri populare</CardTitle>
            <CardDescription>
              Cele mai generate tipuri de cursuri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockTopCourses.map((course, index) => (
                  <div key={course.subject} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="font-medium">{course.subject}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{course.count} cursuri</p>
                        <p className="text-xs text-muted-foreground">{course.percentage}%</p>
                      </div>
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${course.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Analize utilizatori</CardTitle>
            <CardDescription>
              Statistici detaliate despre comportamentul utilizatorilor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total utilizatori</p>
                  <p className="text-2xl font-bold">{mockUserStats.totalUsers.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Utilizatori noi (luna aceasta)</p>
                  <p className="text-2xl font-bold">{mockUserStats.newUsersThisMonth}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rata de abandon</p>
                  <p className="text-2xl font-bold">{mockUserStats.churnRate}%</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Timp mediu de sesiune</p>
                  <p className="text-2xl font-bold">{mockUserStats.averageSessionTime}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Utilizatori activi</p>
                  <p className="text-2xl font-bold">{mockUserStats.activeUsers.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rata de conversie</p>
                  <p className="text-2xl font-bold">{mockUserStats.conversionRate}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <SiteFooter />
    </div>
  );
}