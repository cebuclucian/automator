import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import LanguageSwitcher from '@/components/language-switcher';
import { SubscriptionStatus } from '@/components/subscription-status';
import { BookCheck, MenuIcon } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const t = useTranslation();

  return (
    <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-14 items-center">
        {/* Logo and Brand */}
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Automator.ro
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium hidden md:flex">
          <Link 
            to="/despre" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('landing.about')}
          </Link>
          <Link 
            to="/preturi" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('landing.pricing')}
          </Link>
          <Link 
            to="/contact" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            {t('landing.contact')}
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <Link to="/" className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Automator.ro</span>
            </Link>
            <nav className="flex flex-col space-y-4">
              <SheetClose asChild>
                <Link 
                  to="/despre" 
                  className="text-foreground/60 transition-colors hover:text-foreground"
                >
                  {t('landing.about')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/preturi" 
                  className="text-foreground/60 transition-colors hover:text-foreground"
                >
                  {t('landing.pricing')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/contact" 
                  className="text-foreground/60 transition-colors hover:text-foreground"
                >
                  {t('landing.contact')}
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search could go here */}
          </div>
          <nav className="flex items-center space-x-2">
            {/* Language and Theme Controls */}
            <div className="hidden sm:flex items-center space-x-2">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
            
            {/* User Authentication */}
            {user ? (
              <div className="flex items-center space-x-2">
                <SubscriptionStatus />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        {t('dashboard.title')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/genereaza-curs">
                        {t('generate.title')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cursuri">
                        {t('nav.courses')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    {user.email === 'admin@automator.ro' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin">
                            {t('nav.admin')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-red-600 focus:text-red-600"
                    >
                      {t('auth.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('auth.signIn')}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">{t('auth.signUp')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Language and Theme Controls */}
            <div className="sm:hidden flex items-center space-x-1">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}