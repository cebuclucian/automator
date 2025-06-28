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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 mr-4">
          <Link to="/" className="flex items-center gap-2">
            <BookCheck className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg hidden sm:inline-block">Automator.ro</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/despre" className="text-sm font-medium transition-colors hover:text-primary">
            {t('landing.about')}
          </Link>
          <Link to="/preturi" className="text-sm font-medium transition-colors hover:text-primary">
            {t('landing.pricing')}
          </Link>
          <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
            {t('landing.contact')}
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <BookCheck className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Automator.ro</span>
            </Link>
            <nav className="flex flex-col gap-4">
              <SheetClose asChild>
                <Link to="/despre" className="text-sm font-medium transition-colors hover:text-primary">
                  {t('landing.about')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/preturi" className="text-sm font-medium transition-colors hover:text-primary">
                  {t('landing.pricing')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
                  {t('landing.contact')}
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  <Link to="/profil">
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/abonament">
                    {t('nav.subscription')}
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
                <DropdownMenuItem onClick={() => signOut()}>
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t('auth.signIn')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">{t('auth.signUp')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}