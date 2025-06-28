import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languageOptions = [
  { value: 'ro', label: 'Română', flag: '🇷🇴' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = languageOptions.find(lang => lang.value === language);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
        <SelectTrigger className="w-auto h-8 gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage?.flag}</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}