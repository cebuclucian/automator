import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const t = useTranslation();
  
  // Determine which legal document to display
  const isTerms = type === 'terms';
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight">
            {isTerms ? t('landing.footer.terms') : t('landing.footer.privacy')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isTerms ? t('legal.termsSubtitle') : t('legal.privacySubtitle')}
          </p>
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          {isTerms ? (
            // Terms and Conditions content
            <>
              <h2>1. Introduction</h2>
              <p>
                Welcome to Automator.ro. These Terms and Conditions govern your use of our website and services. 
                By accessing or using Automator.ro, you agree to be bound by these Terms. If you disagree with any 
                part of the terms, you may not access the service.
              </p>
              
              <h2>2. Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate, complete, and up-to-date information. 
                You are responsible for safeguarding the password and for all activities that occur under your account. 
                You agree to notify us immediately of any unauthorized use of your account.
              </p>
              
              <h2>3. Subscriptions</h2>
              <p>
                Automator.ro offers various subscription plans with different features and limitations. 
                Subscription fees are charged monthly in advance. Your subscription will automatically renew 
                unless you cancel it before the renewal date. No refunds are provided for partial months.
              </p>
              <p>
                Free tier accounts are limited to 1 generation per month in preview mode only.
              </p>
              
              <h2>4. Content Generation</h2>
              <p>
                Automator.ro uses artificial intelligence to generate course materials based on your inputs. 
                While we strive for quality and accuracy, we cannot guarantee that all generated content will 
                be error-free, complete, or suitable for your specific needs. You are responsible for reviewing 
                and editing the generated content before use.
              </p>
              
              <h2>5. Intellectual Property</h2>
              <p>
                You retain ownership of your inputs to our service. Automator.ro grants you a license to use 
                the generated materials for your educational, training, or business purposes. You may not 
                redistribute, sell, or otherwise commercialize the raw outputs of our service without modification.
              </p>
              
              <h2>6. Limitations</h2>
              <p>
                Our service is provided "as is" without warranties of any kind. Automator.ro shall not be liable 
                for any direct, indirect, incidental, special, consequential, or punitive damages resulting from 
                your use of or inability to use the service.
              </p>
              
              <h2>7. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of significant changes 
                by posting the new Terms on this page and/or via email. Your continued use of the service after such 
                modifications constitutes your acceptance of the new Terms.
              </p>
              
              <h2>8. Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us at contact@automator.ro.
              </p>
            </>
          ) : (
            // Privacy Policy content
            <>
              <h2>1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, such as when you create an account, 
                subscribe to our service, or communicate with us. This may include your name, email address, 
                payment information, and any other information you choose to provide.
              </p>
              <p>
                We also collect information about your use of our services, including your course generation inputs, 
                preferences, and usage statistics.
              </p>
              
              <h2>2. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                <li>Personalize and improve the services</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              </ul>
              
              <h2>3. Sharing of Information</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your information with:
              </p>
              <ul>
                <li>Service providers who perform services on our behalf</li>
                <li>Partners with whom we offer co-branded services or joint marketing activities</li>
                <li>Law enforcement or other third parties in response to legal requests</li>
              </ul>
              
              <h2>4. Data Retention</h2>
              <p>
                We will retain your information for as long as your account is active or as needed to provide you 
                services. We will retain and use your information as necessary to comply with our legal obligations, 
                resolve disputes, and enforce our agreements.
              </p>
              
              <h2>5. Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse, and 
                unauthorized access, disclosure, alteration, and destruction.
              </p>
              
              <h2>6. Your Rights</h2>
              <p>
                You may access, update, correct, or delete your account information by logging into your account 
                settings. You may also contact us to request access to, correct, or delete any personal information 
                that you have provided to us.
              </p>
              
              <h2>7. Changes to this Policy</h2>
              <p>
                We may change this privacy policy from time to time. If we make changes, we will notify you by 
                revising the date at the top of the policy and, in some cases, we may provide you with additional 
                notice (such as by adding a statement to our website or sending you a notification).
              </p>
              
              <h2>8. Contact</h2>
              <p>
                If you have any questions about this privacy policy, please contact us at privacy@automator.ro.
              </p>
            </>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}