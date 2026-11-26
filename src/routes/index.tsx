import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Dumbbell, MapPin, Menu, MoveUpRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrialForm } from '@/components/trial-form';

const logo = { url: '/00-marca/logo-horizontal-transparente.png' };
const firstClass = { url: '/01-topo/primeira-aula.webp' };
const gym = { url: '/01-topo/sala-de-treino.webp' };
const weights = { url: '/02-modalidades/musculacao.webp' };
const functional = { url: '/02-modalidades/funcional.webp' };
const pilates = { url: '/02-modalidades/pilates.webp' };
const dance = { url: '/02-modalidades/danca.webp' };
const centro = { url: '/03-unidades/centro.webp' };
const estreito = { url: '/03-unidades/estreito.webp' };
const saoJose = { url: '/03-unidades/sao-jose.webp' };
const conversation = { url: '/04-acolhimento/conversa-com-instrutora.webp' };
const reception = { url: '/04-acolhimento/chegada-na-recepcao.webp' };
const preparation = { url: '/04-acolhimento/preparando-o-treino.webp' };

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Aula experimental gratuita | Rede Ritmo' },
    { name: 'description', content: 'Seu próximo ritmo começa aqui. Escolha entre Musculação, Funcional, Pilates e Dança e solicite uma aula gratuita nas unidades Centro, Estreito e São José.' },
    { property: 'og:title', content: 'Seu próximo ritmo começa aqui | Rede Ritmo' },
    { property: 'og:description', content: 'Conheça a Rede Ritmo e solicite sua primeira aula experimental gratuita. Três unidades e uma equipe pronta para receber você.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const navItems = [
  { id: 'inicio', label: 'Início' },
  { id: 'modalidades', label: 'Modalidades' },
  { id: 'unidades', label: 'Unidades' },
  { id: 'como-funciona', label: 'Como funciona' },
];

const modalityItems = [
  { title: 'Musculação', image: weights.url, description: 'Desenvolva sua força, resistência e condicionamento físico.' },
  { title: 'Funcional', image: functional.url, description: 'Movimente seu corpo com exercícios dinâmicos e funcionais.' },
  { title: 'Pilates', image: pilates.url, description: 'Trabalhe equilíbrio, flexibilidade, postura e consciência corporal.' },
  { title: 'Dança', image: dance.url, description: 'Movimente-se, divirta-se e aproveite os benefícios da atividade física.' },
];

const unitItems = [
  { name: 'Centro', value: 'centro', image: centro.url },
  { name: 'Estreito', value: 'estreito', image: estreito.url },
  { name: 'São José', value: 'sao-jose', image: saoJose.url },
];

const steps = [
  { title: 'ESCOLHA', text: 'Informe seus dados e escolha a unidade e a modalidade desejada.' },
  { title: 'SOLICITAÇÃO', text: 'Seu pedido será registrado e encaminhado para a equipe responsável.' },
  { title: 'PRIORIDADE', text: 'Identificamos quando você pretende começar para organizar a ordem dos contatos.' },
  { title: 'CONTATO', text: 'A equipe da unidade escolhida poderá entrar em contato para dar continuidade ao atendimento.' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow"><span className="eyebrow-dot" />{children}</div>;
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [active, setActive] = useState('inicio');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
    );
    navItems.forEach(item => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  function chooseUnit(value: string) {
    setUnit(value);
    document.getElementById('formulario')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return <>
    <header className="site-header">
      <div className="page-container header-inner">
        <a href="#inicio" aria-label="Rede Ritmo — início"><img className="brand-logo" src={logo.url} alt="Rede Ritmo" /></a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map(item => <a key={item.id} href={`#${item.id}`} className={active === item.id ? 'active' : ''}>{item.label}</a>)}
          <Button asChild className="campaign-button"><a data-cta href="#formulario">Agendar aula grátis<ArrowUpRight /></a></Button>
        </nav>
        <Button className="mobile-menu-button" variant="ghost" size="icon" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="menu-mobile" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
      </div>
      {menuOpen && (
        <nav id="menu-mobile" className="mobile-nav" aria-label="Navegação celular">
          {navItems.map(item => <a href={`#${item.id}`} key={item.id} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <Button asChild className="campaign-button"><a href="#formulario" onClick={() => setMenuOpen(false)}>Agendar aula grátis<ArrowUpRight /></a></Button>
        </nav>
      )}
    </header>
    <main>
      <section id="inicio" className="campaign-hero">
        <div className="page-container hero-layout">
          <div>
            <Eyebrow>AULA EXPERIMENTAL GRATUITA</Eyebrow>
            <h1 className="hero-title">Seu próximo<br />ritmo <span>começa<br />aqui.</span></h1>
            <p className="hero-description">Experimente uma nova forma de cuidar de você. Escolha sua modalidade, conheça nossa estrutura e venha fazer sua primeira aula gratuita na Rede Ritmo.</p>
            <div className="hero-actions">
              <Button asChild className="campaign-button"><a href="#formulario">Quero minha aula grátis<ArrowUpRight /></a></Button>
              <Button asChild variant="outline" className="campaign-button"><a href="#modalidades">Conhecer modalidades<ArrowRight /></a></Button>
            </div>
            <div className="hero-note"><ShieldCheck aria-hidden="true" /><span>Três unidades, diferentes modalidades e uma equipe pronta para receber você.</span></div>
            <div className="hero-locations"><MapPin aria-hidden="true" /><span>Centro</span><i /><span>Estreito</span><i /><span>São José</span></div>
          </div>
          <div className="hero-photo-wrap">
            <img className="hero-photo" src={firstClass.url} alt="Aluna e instrutora conversando durante uma primeira aula na Rede Ritmo." fetchPriority="high" />
            <div className="photo-caption"><span className="eyebrow-dot" />NO SEU TEMPO. NO SEU RITMO.</div>
            <div className="photo-stamp"><div className="stamp-icon"><Dumbbell size={20} /></div><div><strong>O primeiro passo é seu.</strong><small>A primeira aula é por nossa conta.</small></div></div>
          </div>
        </div>
      </section>
      <section id="modalidades" className="section section-muted">
        <div className="page-container">
          <div className="section-heading">
            <div><Eyebrow>NOSSAS MODALIDADES</Eyebrow><h2 className="section-title">Encontre o treino que<br />combina com você</h2></div>
            <p className="section-description">Na Rede Ritmo, você encontra diferentes formas de movimentar o corpo, desenvolver sua saúde e alcançar seus objetivos.</p>
          </div>
          <div className="modalities-grid">
            {modalityItems.map((item, i) => (
              <article className="modality-card" key={item.title}>
                <div className="card-image"><img src={item.image} alt={`Aula de ${item.title.toLowerCase()} na Rede Ritmo`} loading="lazy" /><span className="image-number">0{i + 1}</span></div>
                <div className="modality-body"><h3>{item.title}</h3><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="unidades" className="section">
        <div className="page-container">
          <div className="section-heading">
            <div><Eyebrow>NOSSAS UNIDADES</Eyebrow><h2 className="section-title">Uma Rede Ritmo perto de você</h2><p className="section-description">Escolha a unidade que deseja conhecer e venha experimentar nossos espaços.</p></div>
            <a className="section-link" href="#formulario">Seu novo ritmo está aqui<MoveUpRight size={17} /></a>
          </div>
          <div className="units-grid">
            {unitItems.map(item => (
              <article className="unit-card" key={item.value}>
                <img src={item.image} alt={`Espaço de treino da unidade ${item.name}`} loading="lazy" />
                <div className="unit-content">
                  <h3><MapPin aria-hidden="true" />{item.name}</h3>
                  <Button variant="secondary" className="unit-button" onClick={() => chooseUnit(item.value)} aria-label={`Escolher esta unidade: ${item.name}`}>
                    {unit === item.value ? <><span>Unidade selecionada</span><Check /></> : <><span>Escolher esta unidade</span><ArrowUpRight /></>}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <div className="structure-strip"><img src={gym.url} alt="Sala de treino da Rede Ritmo com equipamentos e luz natural" loading="lazy" /><p><strong>Espaços para se movimentar. Uma equipe para acolher.</strong>Conheça nossa estrutura na sua primeira aula.</p></div>
        </div>
      </section>
      <section id="como-funciona" className="section section-muted">
        <div className="page-container">
          <div className="section-heading">
            <div><Eyebrow>COMO FUNCIONA</Eyebrow><h2 className="section-title">É simples começar</h2></div>
            <p className="section-description">Em poucos passos, você solicita sua aula experimental gratuita.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div className="step" key={step.title}><div className="step-number">0{i + 1}</div><h3>{step.title}</h3><p>{step.text}</p></div>
            ))}
          </div>
          <div className="welcome-strip">
            <img src={reception.url} alt="Aluna sendo acolhida na recepção da Rede Ritmo" loading="lazy" />
            <img src={preparation.url} alt="Tênis, toalha e garrafa preparados para a primeira aula" loading="lazy" />
          </div>
        </div>
      </section>
      <section id="formulario" className="section">
        <div className="page-container form-layout">
          <div className="form-intro">
            <Eyebrow>SUA PRIMEIRA AULA</Eyebrow>
            <h2 className="section-title">Agende sua aula experimental <span className="text-primary">gratuita</span></h2>
            <p className="section-description">Preencha seus dados, escolha onde deseja treinar e conte quando pretende começar. Nossa equipe receberá sua solicitação.</p>
            <img className="form-intro-photo" src={conversation.url} alt="Aluna conversando com uma instrutora da Rede Ritmo." loading="lazy" />
          </div>
          <TrialForm unit={unit} onUnitChange={setUnit} />
        </div>
      </section>
    </main>
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#inicio" aria-label="Rede Ritmo — voltar ao início"><img src={logo.url} className="brand-logo" alt="Rede Ritmo" loading="lazy" /></a>
            <p>A Rede Ritmo é uma academia fictícia criada para o projeto avaliativo de No-Code e Low-Code do SENAI SC.</p>
          </div>
          <div className="footer-column"><h4>Seu próximo passo</h4><a href="#inicio">Início</a><a href="#como-funciona">Como funciona</a><a href="#formulario">Aula experimental grátis ↗</a></div>
          <div className="footer-column"><h4>Modalidades</h4>{modalityItems.map(m => <a key={m.title} href="#modalidades">{m.title}</a>)}</div>
          <div className="footer-column"><h4>Unidades</h4>{unitItems.map(u => <a key={u.value} href="#unidades">{u.name}</a>)}</div>
        </div>
        <div className="footer-bottom"><span>© 2026 Rede Ritmo · Projeto acadêmico</span><span>Movimento, saúde e um novo começo.</span></div>
      </div>
    </footer>
  </>;
}
