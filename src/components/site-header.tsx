import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import LanguageSwitcher from '@/components/language-switcher';
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline-block">
              Automator.ro
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/despre" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('landing.about')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/preturi" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('landing.pricing')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/contact" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {t('landing.contact')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-muted/50">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Automator.ro</span>
            </Link>
            <nav className="flex flex-col gap-4">
              <SheetClose asChild>
                <Link 
                  to="/despre" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {t('landing.about')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/preturi" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {t('landing.pricing')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/contact" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {t('landing.contact')}
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Language and Theme Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
          
          {/* User Authentication */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    {t('dashboard.title')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/genereaza-curs" className="cursor-pointer">
                    {t('generate.title')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cursuri" className="cursor-pointer">
                    {t('nav.courses')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/abonament" className="cursor-pointer">
                    {t('nav.subscription')}
                  </Link>
                </DropdownMenuItem>
                {user.email === 'admin@automator.ro' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        {t('nav.admin')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Link to="/login">{t('auth.signIn')}</Link>
              </Button>
              <Button 
                asChild 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Link to="/register">{t('auth.signUp')}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Language and Theme Controls */}
          <div className="sm:hidden flex items-center gap-1">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}