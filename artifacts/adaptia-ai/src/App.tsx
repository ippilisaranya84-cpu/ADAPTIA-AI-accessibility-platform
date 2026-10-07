import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDown, ArrowLeftRight, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, FileText, Globe2, Languages, LayoutDashboard, LogOut, Menu,
  MessageSquareText, Settings, ShieldCheck, Sparkles, UploadCloud, UserRound, X,
} from 'lucide-react';
import { getGetLanguageQueryKey, useCreateAdaptation, useGetLanguage, useListLanguages } from '@workspace/api-client-react';
import type { AdaptationInput, AdaptationResult, Language } from '@workspace/api-client-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './index.css';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) || '';
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const STORAGE_KEY = 'adaptia.local';
const PREF_KEY = 'adaptia.preferences';
const FORM_KEY = 'adaptia.pending';
const initialPreferences = { language: '', readingLevel: 'plain' as 'plain' | 'standard', bilingual: false, describeImages: true };
type StoredAdaptation = { result: AdaptationResult; sourceText: string };

function storageKeyForUser(key: string, userId?: string | null) {
  return userId ? `${key}.${encodeURIComponent(userId)}` : null;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

function readHistory(userId?: string | null): StoredAdaptation[] {
  const key = storageKeyForUser(STORAGE_KEY, userId);
  if (!key) return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]') as StoredAdaptation[]; } catch { return []; }
}
function saveHistory(userId: string | null | undefined, item: StoredAdaptation) {
  const key = storageKeyForUser(STORAGE_KEY, userId);
  if (!key) return;
  const current = readHistory(userId).filter((entry) => entry.result.id !== item.result.id);
  localStorage.setItem(key, JSON.stringify([item, ...current].slice(0, 40)));
}
function readPreferences(userId?: string | null) {
  const key = storageKeyForUser(PREF_KEY, userId);
  if (!key) return initialPreferences;
  try { return { ...initialPreferences, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return initialPreferences; }
}
function savePreferences(userId: string | null | undefined, next: typeof initialPreferences) {
  const key = storageKeyForUser(PREF_KEY, userId);
  if (key) localStorage.setItem(key, JSON.stringify(next));
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#28685a', colorForeground: '#203b35', colorMutedForeground: '#657a73',
    colorDanger: '#b1443c', colorBackground: '#fbf9f4', colorInput: '#fbf9f4',
    colorInputForeground: '#203b35', colorNeutral: '#d9d7ce', fontFamily: 'DM Sans',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf9f4] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#203b35] font-semibold', headerSubtitle: 'text-[#657a73]',
    socialButtonsBlockButtonText: 'text-[#203b35]', formFieldLabel: 'text-[#203b35]',
    footerActionLink: 'text-[#28685a]', footerActionText: 'text-[#657a73]',
    dividerText: 'text-[#657a73]', identityPreviewEditButton: 'text-[#28685a]',
    formFieldSuccessText: 'text-[#28685a]', alertText: 'text-[#203b35]',
    logoBox: 'mb-2', logoImage: 'h-8', socialButtonsBlockButton: 'border-[#d9d7ce]',
    formButtonPrimary: 'bg-[#28685a] hover:bg-[#205448]', formFieldInput: 'border-[#d9d7ce]',
    footerAction: 'text-[#657a73]', dividerLine: 'bg-[#d9d7ce]', alert: 'border-[#d9d7ce]',
    otpCodeFieldInput: 'border-[#d9d7ce]', formFieldRow: 'text-[#203b35]', main: 'text-[#203b35]',
  },
};

function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="Adaptia AI home" data-testid="link-brand">
    <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
    <span>adaptia<span className="brand-ai">.ai</span></span>
  </Link>;
}

function Home() {
  return <>
    <header className="landing-nav">
      <Brand />
      <nav aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#principles">Our approach</a>
      </nav>
      <div className="nav-actions">
        <Link href="/sign-in" className="nav-signin" data-testid="link-signin">Sign in</Link>
        <Link href="/sign-up" className="button button-small" data-testid="link-get-started">Get started <ArrowRight size={16} /></Link>
      </div>
    </header>
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A more human way to understand</div>
          <h1>Information should<br />meet <em>you</em> where you are.</h1>
          <p className="hero-tagline">Same information. Different needs. Every language. One AI that adapts.</p>
          <p className="hero-description">Make a dense page easier to read, bridge a language gap, or understand the text inside an image. Start with what you have. Choose what works for you.</p>
          <div className="hero-ctas">
            <Link href="/sign-up" className="button" data-testid="link-start-adapting">Start adapting <ArrowRight size={17} /></Link>
            <a href="#how-it-works" className="text-link">See how it works <ArrowDown size={16} /></a>
          </div>
          <div className="hero-note"><ShieldCheck size={15} /> Your content is processed to create your adaptation. No private cloud storage is offered.</div>
        </div>
        <div className="hero-art" aria-label="Illustration showing one message adapted into different formats">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-center"><span className="art-sun" /><span className="art-center-label">one message</span></div>
          <div className="adapt-card card-plain"><span className="mini-label">PLAIN LANGUAGE</span><span className="card-lines"><i /><i /><i /></span><span className="mini-check"><Check size={12} /></span></div>
          <div className="adapt-card card-language"><span className="language-glyph">あ</span><span><b>Español</b><small>una nueva forma</small></span></div>
          <div className="adapt-card card-facts"><span className="facts-mark"><span /><span /><span /></span><span><b>Key facts</b><small>clear, at a glance</small></span></div>
          <div className="art-caption">Same meaning.<br /><strong>A way that fits.</strong></div>
          <span className="art-orbit-dot dot-a" /><span className="art-orbit-dot dot-b" /><span className="art-orbit-dot dot-c" />
        </div>
        <div className="hero-footer">
          <span>DESIGNED AROUND YOUR PREFERENCES</span><span className="hero-footer-rule" /><span>LANGUAGE · READING LEVEL · FORMAT</span>
        </div>
      </section>
      <section className="value-strip" id="principles">
        <div className="value-intro"><span className="section-kicker">A little more access.</span><h2>Keep the meaning.<br /><em>Change the experience.</em></h2></div>
        <div className="value-item"><span className="value-icon"><BookOpen size={19} /></span><h3>At your reading level</h3><p>Turn complex writing into clear, plain language while keeping the ideas that matter.</p></div>
        <div className="value-item"><span className="value-icon"><Languages size={19} /></span><h3>In your language</h3><p>Choose a language you’re comfortable with. We’ll show what’s supported before you begin.</p></div>
        <div className="value-item"><span className="value-icon"><MessageSquareText size={19} /></span><h3>In a format that helps</h3><p>Get a thoughtful summary, key facts, and descriptions when image details are available.</p></div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="how-heading"><span className="section-kicker">Simple by design</span><h2>From hard to read<br />to <em>ready to understand.</em></h2><p>No special setup. Just the content you want to make more accessible.</p></div>
        <div className="steps-row">
          {[['01', 'Bring your content', 'Paste text or add an image or PDF. Your original stays yours.'], ['02', 'Choose what works', 'Pick a language and reading level. Your preferences are always yours to change.'], ['03', 'Get a clear version', 'See what changed, what could not be supported, and the adapted result.']].map(([n, title, body]) =>
            <article className="step-card" key={n}><span className="step-number">{n}</span><div className="step-arrow"><ArrowRight size={16} /></div><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>
      <section className="honesty-section">
        <div className="honesty-mark"><CircleHelp size={25} /></div>
        <div><span className="section-kicker">Honest, by default</span><h2>Access starts with trust.</h2><p>Language tools and media support vary. Adaptia checks provider capabilities and tells you when something is partial or unavailable. If a PDF has no extractable text, we’ll say so — we won’t pretend to read it.</p></div>
        <div className="honesty-stamp">CLEAR<br />ABOUT<br />LIMITS</div>
      </section>
      <section className="closing-cta"><div><span className="section-kicker">Start with one thing</span><h2>Make room for<br /><em>understanding.</em></h2></div><Link href="/sign-up" className="button button-light" data-testid="link-create-account">Create your free account <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="landing-footer"><Brand /><span>Access to information should adapt to people.</span><small>© Adaptia AI</small></footer>
  </>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-loading" aria-live="polite">Preparing your space…</div>;
  return isSignedIn ? <Redirect to="/dashboard" /> : <Home />;
}

function ClerkAuthPages() {
  return <Switch>
    <Route path="/sign-in/*?"><div className="auth-page"><Brand /><div className="auth-message"><span className="section-kicker">Your way to understand</span><h1>Welcome back<br /><em>to Adaptia.</em></h1><p>Your preferences are here when you need them.</p></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></Route>
    <Route path="/sign-up/*?"><div className="auth-page"><Brand /><div className="auth-message"><span className="section-kicker">Access begins here</span><h1>Make information<br /><em>work for you.</em></h1><p>A little more clarity, in the language and format you choose.</p></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></Route>
  </Switch>;
}

function ClerkQueryInvalidator() {
  const { addListener } = useClerk();
  const prevUser = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const id = user?.id ?? null;
    if (prevUser.current !== undefined && prevUser.current !== id) queryClient.clear();
    prevUser.current = id;
  }), [addListener]);
  return null;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-loading" aria-live="polite">Preparing your space…</div>;
  return isSignedIn ? <>{children}</> : <Redirect to="/" />;
}

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/upload', label: 'New adaptation', icon: Sparkles },
  { href: '/history', label: 'History', icon: Clock3 },
];
function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const name = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Your account';
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-menu"><X size={19} /></button></div>
      <div className="side-caption">YOUR WORKSPACE</div>
      <nav className="side-nav" aria-label="Workspace navigation">
        {navigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`side-link ${location === href ? 'active' : ''}`} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} /><span>{label}</span>{href === '/upload' && <span className="side-plus">+</span>}</Link>)}
      </nav>
      <div className="side-separator" />
      <div className="side-caption">PREFERENCES</div>
      <nav className="side-nav" aria-label="Account navigation">
        <Link href="/profile" className={`side-link ${location === '/profile' ? 'active' : ''}`} data-testid="link-nav-profile"><UserRound size={18} /><span>Profile</span></Link>
        <Link href="/settings" className={`side-link ${location === '/settings' ? 'active' : ''}`} data-testid="link-nav-settings"><Settings size={18} /><span>Settings</span></Link>
      </nav>
      <div className="sidebar-bottom"><div className="privacy-card"><ShieldCheck size={17} /><div><b>Your work stays local</b><span>History and preferences stay in this browser.</span></div></div><div className="user-summary"><span className="user-avatar">{name.slice(0, 1).toUpperCase()}</span><span className="user-summary-name">{name}</span><SignOutButton /></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="app-main">
      <header className="app-topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-menu"><Menu size={20} /></button><div className="breadcrumb"><span>Adaptia</span><span>/</span><b>{title}</b></div><div className="topbar-right"><span className="local-indicator"><span /> Local workspace</span><span className="top-avatar">{name.slice(0, 1).toUpperCase()}</span></div></header>
      <main className="page-content">{children}</main>
    </div>
  </div>;
}

function SignOutButton() {
  const { signOut } = useClerk();
  return <button type="button" className="signout-button" onClick={() => signOut({ redirectUrl: basePath || '/' })} aria-label="Sign out" data-testid="button-sign-out"><LogOut size={16} /></button>;
}

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: React.ReactNode; detail?: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="section-kicker">{eyebrow}</div><h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function Dashboard() {
  const { user } = useUser();
  const history = useMemo(() => readHistory(user?.id), [user?.id]);
  const name = user?.firstName || 'there';
  const prefs = readPreferences(user?.id);
  return <AppShell title="Overview"><PageHeading eyebrow="YOUR SPACE" title={<>Good to see you, <em>{name}.</em></>} detail="One clear step at a time. What would you like to understand today?" action={<Link href="/upload" className="button" data-testid="link-new-adaptation"><Sparkles size={16} /> New adaptation</Link>} />
    <section className="dashboard-feature">
      <div className="feature-copy"><span className="feature-overline"><span /> READY WHEN YOU ARE</span><h2>Start with the information.<br /><em>We’ll help with the rest.</em></h2><p>Paste text, add an image, or upload a PDF to shape it around the way you read.</p><Link href="/upload" className="button" data-testid="link-adapt-content">Adapt something <ArrowRight size={17} /></Link></div>
      <div className="feature-visual"><div className="feature-paper"><span className="paper-badge">SOURCE</span><i /><i /><i /><i className="short" /><span className="paper-fold" /></div><ArrowRight className="feature-arrow" size={22} /><div className="feature-paper adapted"><span className="paper-badge">MADE CLEAR</span><i /><i className="short" /><div className="paper-highlight">Key idea, made easier to follow.</div><i className="shorter" /></div><div className="feature-sparkle"><Sparkles size={18} /></div></div>
      <div className="feature-annotation">Your words, at your pace.</div>
    </section>
    <div className="dashboard-lower">
      <section className="recent-block"><div className="section-title-row"><div><span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>Recent adaptations</h2></div><Link href="/history" className="quiet-link" data-testid="link-view-history">View history <ArrowRight size={15} /></Link></div>
        {history.length ? <div className="recent-list">{history.slice(0, 4).map(({ result }) => <Link href={`/results/${encodeURIComponent(result.id)}`} className="recent-item" key={result.id} data-testid={`link-recent-${result.id}`}><span className="recent-file"><FileText size={18} /></span><span className="recent-main"><b>{result.summary || 'Adapted content'}</b><small>{result.sourceLanguageName} <ArrowRight size={11} /> {result.targetLanguageName} · {new Date(result.createdAt).toLocaleDateString()}</small></span><ArrowRight className="recent-chevron" size={16} /></Link>)}</div> : <div className="empty-recent"><div className="empty-icon"><BookOpen size={22} /></div><div><b>Your adaptations will appear here.</b><p>Start with a piece of information that matters to you.</p></div><Link href="/upload" className="text-link" data-testid="link-first-adaptation">Make your first one <ArrowRight size={15} /></Link></div>}
      </section>
      <aside className="preferences-glance"><span className="section-kicker">YOUR DEFAULTS</span><h2>Set up for you.</h2><div className="preference-line"><span className="preference-symbol"><Languages size={16} /></span><span><small>Preferred language</small><b>{prefs.language ? languageLabel(prefs.language) : 'Choose when adapting'}</b></span></div><div className="preference-line"><span className="preference-symbol"><BookOpen size={16} /></span><span><small>Reading level</small><b>{prefs.readingLevel === 'plain' ? 'Plain language' : 'Standard'}</b></span></div><Link href="/settings" className="quiet-link" data-testid="link-edit-preferences">Edit preferences <ArrowRight size={15} /></Link></aside>
    </div>
    <div className="data-note"><ShieldCheck size={16} /><span><b>Private by design.</b> Your saved history and preferences are stored on this device only. Adaptia does not offer private cloud storage.</span></div>
  </AppShell>;
}

function languageLabel(code: string) {
  return code || 'Not selected';
}

function LanguageSelect({ id, value, onChange, languages, loading, error, label, allowAuto = false }: { id: string; value: string; onChange: (value: string) => void; languages?: Language[]; loading: boolean; error: boolean; label: string; allowAuto?: boolean }) {
  return <div className="field"><label htmlFor={id}>{label}</label><div className="select-wrap"><select id={id} value={value} onChange={(event) => onChange(event.target.value)} data-testid={`select-${id}`}><option value="">{allowAuto ? 'Detect from content' : 'Choose a language'}</option>{languages?.map((lang) => <option key={lang.code} value={lang.code}>{lang.name} · {lang.nativeName}</option>)}</select><ChevronDown size={16} /></div>{loading && <small className="field-hint">Loading available languages…</small>}{error && <small className="field-error" role="alert">Language options could not load. Try again in a moment.</small>}</div>;
}

const capabilityInfo: Record<string, string> = {
  detection: 'Language detection', translation: 'Translation', transliteration: 'Transliteration',
  tts: 'Text to speech', stt: 'Speech to text', ocr: 'Text in images (OCR)', imageText: 'Image text understanding',
};
function CapabilityNotice({ language }: { language?: Language }) {
  const [code, setCode] = useState('');
  useEffect(() => setCode(language?.code || ''), [language?.code]);
  const { data } = useGetLanguage(code, { query: { enabled: !!code, queryKey: getGetLanguageQueryKey(code) } });
  const selected = data || language;
  if (!selected) return <div className="capability-empty"><CircleHelp size={16} /> Choose a language to see which capabilities are verified.</div>;
  const entries = Object.entries(selected.capabilities);
  return <div className="capability-box"><div className="capability-heading"><Globe2 size={16} /><b>{selected.name} support</b><span>{selected.region} · {selected.script} script · {selected.direction.toUpperCase()}</span></div><div className="capability-list">{entries.map(([key, state]) => <span key={key} className={`capability-chip state-${state.toLowerCase()}`}><span className="cap-dot" />{capabilityInfo[key]} <b>{state === 'FULL' ? 'Available' : state === 'PARTIAL' ? 'Partial' : 'Unavailable'}</b></span>)}</div><p>Support reflects current provider capability information. Partial or unavailable tools may not be performed.</p></div>;
}

function UploadPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { data: languages, isLoading, isError } = useListLanguages();
  const saved = readPreferences(user?.id);
  const [text, setText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(saved.language);
  const [readingLevel, setReadingLevel] = useState<'plain' | 'standard'>(saved.readingLevel);
  const [bilingual, setBilingual] = useState(saved.bilingual);
  const [describeImages, setDescribeImages] = useState(saved.describeImages);
  const [images, setImages] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [pdfNote, setPdfNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = languages?.find((item) => item.code === targetLanguage);
  const fileInput = useRef<HTMLInputElement>(null);
  async function processFiles(files: FileList | File[]) {
    setError(''); setPdfNote('');
    const list = Array.from(files);
    let imageAdded = 0;
    for (const file of list) {
      if (file.type === 'application/pdf') {
        try {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
          const bytes = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: bytes }).promise;
          let extracted = '';
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 30); pageNum += 1) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            extracted += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
          }
          if (extracted.trim()) {
            setText((current) => `${current}${current ? '\n\n' : ''}${extracted.trim()}`.slice(0, 40000));
            setFileNames((names) => [...names, file.name]);
            setPdfNote(`Text extracted from ${file.name}. Image-only PDF pages are not read as OCR.`);
          } else {
            setPdfNote(`${file.name} contains no extractable text. Image conversion for PDF pages is not supported here, so no OCR was performed.`);
          }
        } catch {
          setError(`Could not read ${file.name}. Try another PDF or paste its text directly.`);
        }
      } else if (file.type.startsWith('image/')) {
        if (images.length + imageAdded >= 4) { setError('A request can include up to four images. Remove an image to add another.'); continue; }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        }).catch(() => '');
        if (!dataUrl) { setError(`Could not read ${file.name}.`); continue; }
        if (dataUrl.length > 6_000_000) { setError(`${file.name} is too large. Choose an image under the 6 MB request limit.`); continue; }
        imageAdded += 1;
        setImages((current) => current.length < 4 ? [...current, dataUrl] : current);
        setImageNames((names) => [...names, file.name]);
      } else setError(`${file.name} is not a supported file. Add an image or PDF.`);
    }
  }
  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
    setImageNames((current) => current.filter((_, i) => i !== index));
  }
  function continueToAdapt() {
    setError('');
    if (!text.trim() && images.length === 0) { setError('Add some text or at least one image to continue.'); return; }
    if (text.length > 40000) { setError('Text must be 40,000 characters or fewer.'); return; }
    if (!targetLanguage) { setError('Choose a language for your adapted content.'); return; }
    const input: AdaptationInput = { text: text.trim() || null, imageDataUrls: images, sourceLanguage: sourceLanguage || null, targetLanguage, readingLevel, bilingual, describeImages };
    const formKey = storageKeyForUser(FORM_KEY, user?.id);
    if (formKey) sessionStorage.setItem(formKey, JSON.stringify({ input, fileNames: [...fileNames, ...imageNames] }));
    savePreferences(user?.id, { ...readPreferences(user?.id), language: targetLanguage, readingLevel, bilingual, describeImages });
    setBusy(true);
    setLocation('/adapt');
  }
  return <AppShell title="New adaptation"><PageHeading eyebrow="A FRESH START" title={<>Bring the <em>information.</em></>} detail="Paste text or add source material. You stay in control of what gets adapted." />
    <div className="workflow-grid">
      <section className="workflow-panel">
        <div className="panel-heading"><span className="step-disc">1</span><div><h2>Your content</h2><p>Paste text or choose an image or PDF.</p></div></div>
        <label className="sr-only" htmlFor="source-content">Content to adapt</label>
        <textarea id="source-content" className="content-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste or type the information you want to make easier to understand…" maxLength={40000} data-testid="input-source-content" />
        <div className="textarea-foot"><span>{text.length.toLocaleString()} / 40,000 characters</span><span>Text is sent to the adaptation service when you continue.</span></div>
        <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void processFiles(event.dataTransfer.files); }} onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.current?.click(); } }} data-testid="dropzone-content">
          <input ref={fileInput} className="sr-only" type="file" accept="image/*,application/pdf" multiple onChange={(event) => event.target.files && void processFiles(event.target.files)} data-testid="input-file-upload" />
          <span className="drop-icon"><UploadCloud size={20} /></span><span><b>Choose files to add</b><small>Images and PDFs · up to 4 images, 6 MB each</small></span><span className="drop-browse">Browse</span>
        </div>
        {(fileNames.length > 0 || imageNames.length > 0) && <div className="uploaded-files">{fileNames.map((name, index) => <span key={`pdf-${name}-${index}`}><FileText size={14} />{name}<small>text extracted</small></span>)}{imageNames.map((name, index) => <span key={`image-${name}-${index}`}><FileText size={14} />{name}<button onClick={() => removeImage(index)} aria-label={`Remove ${name}`} data-testid={`button-remove-image-${index}`}><X size={13} /></button></span>)}</div>}
        {pdfNote && <div className="inline-notice" role="status"><CircleHelp size={15} />{pdfNote}</div>}
      </section>
      <section className="workflow-panel preference-panel">
        <div className="panel-heading"><span className="step-disc">2</span><div><h2>Your preferences</h2><p>Choose what would be most useful.</p></div></div>
        <LanguageSelect id="source-language" label="Content language" allowAuto value={sourceLanguage} onChange={setSourceLanguage} languages={languages} loading={isLoading} error={isError} />
        <LanguageSelect id="target-language" label="Adapt into" value={targetLanguage} onChange={setTargetLanguage} languages={languages} loading={isLoading} error={isError} />
        <CapabilityNotice language={target} />
        <div className="field"><label htmlFor="reading-level">Reading level</label><div className="select-wrap"><select id="reading-level" value={readingLevel} onChange={(event) => setReadingLevel(event.target.value as 'plain' | 'standard')} data-testid="select-reading-level"><option value="plain">Plain language</option><option value="standard">Standard</option></select><ChevronDown size={16} /></div><small className="field-hint">Plain language prioritizes short sentences and familiar words.</small></div>
        <label className="toggle-row"><input type="checkbox" checked={bilingual} onChange={(event) => setBilingual(event.target.checked)} data-testid="checkbox-bilingual" /><span className="toggle-visual" /><span><b>Show source and adapted text together</b><small>When both versions are available</small></span></label>
        <label className="toggle-row"><input type="checkbox" checked={describeImages} onChange={(event) => setDescribeImages(event.target.checked)} data-testid="checkbox-describe-images" /><span className="toggle-visual" /><span><b>Describe image details</b><small>Only if image understanding is supported</small></span></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button workflow-submit" onClick={continueToAdapt} disabled={busy} data-testid="button-review-plan">Review adaptation plan <ArrowRight size={17} /></button>
      </section>
    </div>
    <p className="upload-disclaimer"><ShieldCheck size={15} /> Submitted content is processed for this adaptation. It is not presented as stored in private cloud storage.</p>
  </AppShell>;
}

function AdaptPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const mutation = useCreateAdaptation();
  const started = useRef(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const formKey = storageKeyForUser(FORM_KEY, user?.id);
    const saved = formKey ? sessionStorage.getItem(formKey) : null;
    if (!saved) { setLoadError('There is no adaptation ready to run. Add content first.'); return; }
    let parsed: { input: AdaptationInput; fileNames: string[] };
    try { parsed = JSON.parse(saved); } catch { setLoadError('Your adaptation details could not be read. Please start again.'); return; }
    mutation.mutate({ data: parsed.input }, {
      onSuccess: (result) => {
        saveHistory(user?.id, { result, sourceText: parsed.input.text || '' });
        if (formKey) sessionStorage.removeItem(formKey);
        setLocation(`/results/${encodeURIComponent(result.id)}`);
      },
      onError: (err) => setLoadError(err instanceof Error ? err.message : 'The adaptation could not be completed. Please try again.'),
    });
  }, []);
  return <AppShell title="Adapting"><div className="progress-view">
    {loadError ? <><div className="error-emblem"><CircleHelp size={24} /></div><span className="section-kicker">LET’S TRY AGAIN</span><h1>We couldn’t start<br /><em>this adaptation.</em></h1><p>{loadError}</p><div className="progress-actions"><Link href="/upload" className="button" data-testid="link-retry-upload">Return to content <ArrowRight size={16} /></Link><Link href="/dashboard" className="quiet-link" data-testid="link-adapt-dashboard">Go to overview</Link></div></> : <><div className="progress-orbit"><div className="progress-core"><Sparkles size={24} /></div><span className="progress-pulse pulse-1" /><span className="progress-pulse pulse-2" /></div><span className="section-kicker">A MOMENT OF CARE</span><h1>Making information<br /><em>easier to meet.</em></h1><p>Checking your preferences, preparing a plan, and shaping your content. This may take a moment.</p><div className="progress-steps"><span><CheckCircle2 size={16} /> Preferences received</span><span className={mutation.isPending ? 'step-current' : ''}><span className="progress-loader" /> Creating adaptation</span><span><span className="step-empty" /> Reviewing the result</span></div><button className="quiet-link cancel-link" onClick={() => setLocation('/upload')} data-testid="button-cancel-adaptation">Cancel and return</button></>}
  </div></AppShell>;
}

function ResultPage() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const [location, setLocation] = useLocation();
  const [tab, setTab] = useState<'adapted' | 'translated' | 'source'>('adapted');
  const [copied, setCopied] = useState(false);
  const item = useMemo(() => readHistory(user?.id).find((entry) => entry.result.id === decodeURIComponent(params.id || '')), [params.id, user?.id]);
  const result = item?.result;
  const textToShow = tab === 'translated' ? (result?.translatedText || '') : tab === 'source' ? (item?.sourceText || '') : result?.adaptedText || '';
  async function copy() {
    if (!textToShow) return;
    try {
      await navigator.clipboard.writeText(textToShow);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }
  if (!result) return <AppShell title="Result"><div className="empty-state"><div className="empty-icon"><FileText size={22} /></div><span className="section-kicker">NOT FOUND IN THIS BROWSER</span><h1>This result isn’t <em>here.</em></h1><p>Adaptation history stays on the device where it was created. It may have been cleared or created elsewhere.</p><Link href="/history" className="button" data-testid="link-result-history">View history <ArrowRight size={16} /></Link></div></AppShell>;
  const availableTabs = [['adapted', 'Adapted'], ...(result.translatedText ? [['translated', 'Translated'] as const] : []), ...(item?.sourceText ? [['source', 'Source text'] as const] : [])] as const;
  return <AppShell title="Adaptation result"><PageHeading eyebrow="YOUR ADAPTED CONTENT" title={<>A clearer <em>way through.</em></>} detail={`${result.sourceLanguageName} to ${result.targetLanguageName} · ${new Date(result.createdAt).toLocaleString()}`} action={<button className="button button-outline" onClick={() => window.print()} data-testid="button-print-result">Print result</button>} />
    <div className="result-layout"><article className="result-main">
      <div className="result-summary"><span className="result-label"><Sparkles size={14} /> AT A GLANCE</span><p>{result.summary}</p><div className="result-tags"><span className={`confidence confidence-${result.confidence}`}><span /> {result.confidence} confidence</span><span><Languages size={13} /> {result.targetLanguageName}</span><span className={`verify-tag ${result.verification.status}`}><CheckCircle2 size={13} /> {result.verification.status === 'passed' ? 'Reviewed' : 'Review recommended'}</span></div></div>
      <div className="result-document"><div className="doc-toolbar"><div className="result-tabs" role="tablist" aria-label="Result text version">{availableTabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setCopied(false); }} data-testid={`tab-result-${key}`}>{label}</button>)}</div><button className="copy-button" onClick={() => void copy()} data-testid="button-copy-result">{copied ? 'Copied' : 'Copy text'}</button></div><div className="adapted-copy" dir="auto">{textToShow || 'No text was returned for this version.'}</div></div>
      {result.translatedText && <div className="result-section"><h2><ArrowLeftRight size={17} /> Translation</h2><p dir="auto">{result.translatedText}</p></div>}
      {result.imageDescription && <div className="result-section"><h2><MessageSquareText size={17} /> Image description</h2><p>{result.imageDescription}</p></div>}
      {!!result.keyFacts.length && <div className="result-section"><h2><CheckCircle2 size={17} /> Key facts</h2><ul>{result.keyFacts.map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}</ul></div>}
    </article><aside className="result-aside">
      <section className="aside-card"><span className="section-kicker">WHAT ADAPTIA DID</span><h2>Your adaptation plan</h2><ol className="plan-list">{result.plan.map((step, index) => <li key={`${step.title}-${index}`}><span className={`plan-status status-${step.status}`}>{step.status === 'complete' ? <Check size={13} /> : step.status === 'not-needed' ? '–' : '!'}</span><span><b>{step.title}</b><small>{step.reason}</small></span></li>)}</ol></section>
      <section className="aside-card verification-card"><span className="section-kicker">A NOTE ON QUALITY</span><h2>{result.verification.status === 'passed' ? 'Checks complete' : 'A second look may help'}</h2>{result.verification.notes.map((note, index) => <p key={index}>{note}</p>)}</section>
      {!!result.notices.length && <section className="notice-card"><CircleHelp size={17} /><div><b>Some things to know</b>{result.notices.map((notice, index) => <p key={index}>{notice}</p>)}</div></section>}
      <div className="result-aside-links"><button className="quiet-link" onClick={() => setLocation('/upload')} data-testid="button-new-adaptation">Adapt something else <ArrowRight size={15} /></button><Link href="/history" className="quiet-link" data-testid="link-back-history">Saved on this device <ArrowRight size={15} /></Link></div>
    </aside></div>
  </AppShell>;
}

function HistoryPage() {
  const { user } = useUser();
  const history = useMemo(() => readHistory(user?.id), [user?.id]);
  return <AppShell title="History"><PageHeading eyebrow="ON THIS DEVICE" title={<>Your saved <em>adaptations.</em></>} detail="This list is stored locally in this browser. It is not synced to a cloud account." />
    {history.length ? <div className="history-list">{history.map(({ result }) => <Link href={`/results/${encodeURIComponent(result.id)}`} className="history-row" key={result.id} data-testid={`link-history-${result.id}`}><span className="history-icon"><FileText size={18} /></span><span className="history-content"><b>{result.summary || 'Adapted content'}</b><small>{result.sourceLanguageName} <ArrowRight size={12} /> {result.targetLanguageName}</small></span><span className="history-date">{new Date(result.createdAt).toLocaleDateString()}</span><ArrowRight className="history-arrow" size={16} /></Link>)}</div> : <div className="empty-state"><div className="empty-icon"><Clock3 size={22} /></div><span className="section-kicker">A FRESH PAGE</span><h1>Nothing saved <em>yet.</em></h1><p>Your completed adaptations will live here on this device, so you can return to them when you need.</p><Link href="/upload" className="button" data-testid="link-history-start">Create an adaptation <ArrowRight size={16} /></Link></div>}
    <div className="data-note"><ShieldCheck size={16} /><span><b>Stored in your browser only.</b> Clearing site data removes saved adaptations from this device.</span></div>
  </AppShell>;
}

function Onboarding() {
  const { user } = useUser();
  const { data: languages, isLoading, isError } = useListLanguages();
  const [, setLocation] = useLocation();
  const [prefs, setPrefs] = useState(() => readPreferences(user?.id));
  function update<K extends keyof typeof initialPreferences>(key: K, value: typeof initialPreferences[K]) { setPrefs((old: typeof initialPreferences) => ({ ...old, [key]: value })); }
  return <AppShell title="Welcome"><div className="onboarding-layout"><div className="onboarding-copy"><span className="section-kicker">LET’S MAKE THIS YOURS</span><h1>What helps you<br /><em>understand?</em></h1><p>Set a few preferences to start. You can change them any time, and they’re saved only in this browser.</p><div className="onboard-decoration"><span><Languages size={20} /></span><span><BookOpen size={20} /></span><span><Sparkles size={20} /></span></div></div><section className="onboarding-form"><div className="panel-heading"><span className="step-disc">1</span><div><h2>Your language</h2><p>Choose a default. You can always change it per adaptation.</p></div></div><LanguageSelect id="onboarding-language" label="Preferred language" value={prefs.language} onChange={(value) => update('language', value)} languages={languages} loading={isLoading} error={isError} /><CapabilityNotice language={languages?.find((language) => language.code === prefs.language)} /><div className="field"><label htmlFor="onboard-level">Reading preference</label><div className="select-wrap"><select id="onboard-level" value={prefs.readingLevel} onChange={(event) => update('readingLevel', event.target.value as 'plain' | 'standard')} data-testid="select-onboarding-level"><option value="plain">Plain language — short, clear sentences</option><option value="standard">Standard — keep the original style</option></select><ChevronDown size={16} /></div></div><label className="toggle-row"><input type="checkbox" checked={prefs.bilingual} onChange={(event) => update('bilingual', event.target.checked)} data-testid="checkbox-onboarding-bilingual" /><span className="toggle-visual" /><span><b>Show both source and adapted text</b><small>When returned by the service</small></span></label><button className="button workflow-submit" onClick={() => { savePreferences(user?.id, prefs); setLocation('/dashboard'); }} data-testid="button-save-onboarding">Save preferences <ArrowRight size={16} /></button><Link href="/dashboard" className="quiet-link skip-link" data-testid="link-skip-onboarding">Skip for now</Link></section></div></AppShell>;
}

function ProfilePage() {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your name';
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setMessage('Your name was updated.');
    } catch {
      setError('Your name could not be updated. Please try again.');
    } finally { setSaving(false); }
  }
  return <AppShell title="Profile"><PageHeading eyebrow="YOUR DETAILS" title={<>Your <em>profile.</em></>} detail="Your sign-in details are managed securely by Clerk." />
    <form className="settings-card profile-edit-card" onSubmit={saveProfile}>
      <div className="profile-card-intro"><div className="profile-avatar">{fullName.slice(0, 1).toUpperCase()}</div><div><h2>Account details</h2><p>Update the name shown in your Adaptia workspace.</p></div></div>
      <div className="profile-input-row"><div className="field"><label htmlFor="profile-first">First name</label><input id="profile-first" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" maxLength={100} data-testid="input-profile-first-name" /></div><div className="field"><label htmlFor="profile-last">Last name</label><input id="profile-last" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" maxLength={100} data-testid="input-profile-last-name" /></div></div>
      <div className="profile-email"><small>Email address</small><b data-testid="text-profile-email">{user?.primaryEmailAddress?.emailAddress || 'Not available'}</b><span>Managed securely by Clerk</span></div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {message && <p className="save-status" role="status"><CheckCircle2 size={15} />{message}</p>}
      <div className="profile-edit-actions"><Link href="/settings" className="quiet-link" data-testid="link-profile-settings">Preferences <ArrowRight size={15} /></Link><button className="button" type="submit" disabled={saving} data-testid="button-save-profile">{saving ? 'Saving…' : 'Save details'} <Check size={15} /></button></div>
    </form>
    <div className="data-note"><ShieldCheck size={16} /><span>Profile information comes from your Clerk account. Adaptia preferences and history remain in local browser storage.</span></div>
  </AppShell>;
}

function SettingsPage() {
  const { user } = useUser();
  const [prefs, setPrefs] = useState(() => readPreferences(user?.id));
  const { data: languages, isLoading, isError } = useListLanguages();
  const [saved, setSaved] = useState(false);
  function update<K extends keyof typeof initialPreferences>(key: K, value: typeof initialPreferences[K]) { setPrefs((old: typeof initialPreferences) => ({ ...old, [key]: value })); setSaved(false); }
  return <AppShell title="Settings"><PageHeading eyebrow="YOUR PREFERENCES" title={<>Make it <em>yours.</em></>} detail="These choices are saved only in this browser. Your original content and adaptation history are not cloud-synced." />
    <section className="settings-card settings-form"><div className="settings-section-heading"><span className="settings-icon"><Languages size={18} /></span><div><h2>Language and reading</h2><p>A starting point, not a rule. Change these whenever you like.</p></div></div><LanguageSelect id="settings-language" label="Preferred language" value={prefs.language} onChange={(value) => update('language', value)} languages={languages} loading={isLoading} error={isError} /><CapabilityNotice language={languages?.find((language) => language.code === prefs.language)} /><div className="field"><label htmlFor="settings-reading">Reading level</label><div className="select-wrap"><select id="settings-reading" value={prefs.readingLevel} onChange={(event) => update('readingLevel', event.target.value as 'plain' | 'standard')} data-testid="select-settings-reading"><option value="plain">Plain language</option><option value="standard">Standard</option></select><ChevronDown size={16} /></div></div><label className="toggle-row"><input type="checkbox" checked={prefs.bilingual} onChange={(event) => update('bilingual', event.target.checked)} data-testid="checkbox-settings-bilingual" /><span className="toggle-visual" /><span><b>Show source and adapted versions together</b><small>When both are available for a result</small></span></label><label className="toggle-row"><input type="checkbox" checked={prefs.describeImages} onChange={(event) => update('describeImages', event.target.checked)} data-testid="checkbox-settings-images" /><span className="toggle-visual" /><span><b>Request image descriptions</b><small>Only where image understanding is supported</small></span></label><div className="settings-actions"><span role="status" className="save-status">{saved ? <><CheckCircle2 size={15} /> Saved on this device</> : 'Changes are not saved yet'}</span><button className="button" onClick={() => { savePreferences(user?.id, prefs); setSaved(true); }} data-testid="button-save-settings">Save preferences <Check size={15} /></button></div></section>
    <section className="settings-card local-data"><div><span className="settings-icon"><ShieldCheck size={18} /></span><div><h2>Browser-local data</h2><p>History and these preferences stay in this browser. Clearing browser storage will remove them.</p></div></div><button className="button button-outline" onClick={() => { const historyKey = storageKeyForUser(STORAGE_KEY, user?.id); const prefsKey = storageKeyForUser(PREF_KEY, user?.id); if (historyKey) localStorage.removeItem(historyKey); if (prefsKey) localStorage.removeItem(prefsKey); setPrefs(initialPreferences); setSaved(false); }} data-testid="button-clear-local">Clear local preferences and history</button></section>
  </AppShell>;
}

function ProtectedRoutes() {
  return <Switch>
    <Route path="/onboarding"><Protected><Onboarding /></Protected></Route>
    <Route path="/dashboard"><Protected><Dashboard /></Protected></Route>
    <Route path="/upload"><Protected><UploadPage /></Protected></Route>
    <Route path="/adapt"><Protected><AdaptPage /></Protected></Route>
    <Route path="/results/:id"><Protected><ResultPage /></Protected></Route>
    <Route path="/history"><Protected><HistoryPage /></Protected></Route>
    <Route path="/profile"><Protected><ProfilePage /></Protected></Route>
    <Route path="/settings"><Protected><SettingsPage /></Protected></Route>
    <Route component={NotFound} />
  </Switch>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/sign-in/*?"><ClerkAuthPages /></Route>
    <Route path="/sign-up/*?"><ClerkAuthPages /></Route>
    <Route><ProtectedRoutes /></Route>
  </Switch></ErrorBoundary>;
}

function ClerkRoutedApp() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your Adaptia workspace' } }, signUp: { start: { title: 'Create your Adaptia account', subtitle: 'Make information work for you' } } }}
    routerPush={(to: string) => setLocation(stripBase(to))}
    routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
  ><ClerkQueryInvalidator /><Router /><Toaster /></ClerkProvider>;
}

function PublicFallback() {
  const [location] = useLocation();
  if (location.startsWith('/sign-in') || location.startsWith('/sign-up')) return <div className="auth-loading"><Brand /><h1>Sign-in setup is not available yet.</h1><p>Clerk authentication needs a publishable key configured for this app.</p><Link className="quiet-link" href="/">Return to Adaptia <ArrowRight size={15} /></Link></div>;
  if (location === '/') return <Home />;
  return <Redirect to="/" />;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}>{clerkPubKey ? <ClerkRoutedApp /> : <PublicFallback />}</WouterRouter></TooltipProvider></QueryClientProvider>;
}

export default App;
