import Link from "next/link";

export default function AboutPage() {
  return <main className="marketing-page"><header className="marketing-nav"><Link href="/" className="brand"><span>♧</span><b>CALM <em>by Angèle</em></b></Link><Link href="/prestations" className="marketing-login">Prestations →</Link></header><section className="marketing-story mt-12"><div className="story-mark">♧</div><div><p className="eyebrow">À propos d’Angèle</p><h1>Une attention sincère, pour chaque animal.</h1><p>À 23 ans, Angèle garde des animaux depuis trois ans. Son approche repose sur le respect du rythme de chacun, la douceur et une vraie relation de confiance avec les familles.</p><p className="mt-4">Titulaire d’un certificat de formation en toilettage avec option éducation canine, elle poursuit actuellement sa formation CTM Toilettage Canin & Félin.</p><Link href="/#demande" className="calm-primary mt-7">Parlons de votre compagnon <span>→</span></Link></div></section></main>;
}
