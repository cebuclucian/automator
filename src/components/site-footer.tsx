import { Link } from 'react-router-dom';
import { BookCheck } from 'lucide-react';
import { useTranslation } from '@/context/language-context';

export default function SiteFooter() {
  const t = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container flex flex-col gap-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <BookCheck className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Automator.ro</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('landing.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('landing.about')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('landing.howItWorks')}
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('landing.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('landing.faq')}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('landing.contact')}</h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="mailto:contact@automator.ro" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    contact@automator.ro
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:+40721234567" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +40 72 123 4567
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('auth.signIn')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('auth.signIn')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t('auth.signUp')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-t pt-8">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} Automator.ro. {t('landing.footer.copyright')}
          </p>
          
          <div className="flex gap-4">
            <Link to="/termeni" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.footer.terms')}
            </Link>
            <Link to="/confidentialitate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}