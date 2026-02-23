export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-100 to-purple-300 flex items-center justify-center p-6">
      
      <div className="max-w-5xl w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-purple-200">

        <h1 className="text-5xl font-extrabold text-purple-900 mb-6 tracking-tight">
          CALM by Angèle 💜
        </h1>

        <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
          Un espace privé pour suivre les séjours,
          conserver les souvenirs et partager
          les moments précieux de vos compagnons.
        </p>

        <div className="flex justify-center gap-6 flex-wrap">

          <a
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg transition transform hover:scale-105"
          >
            Accès Administrateur
          </a>

          <div className="bg-purple-100 text-purple-900 px-8 py-4 rounded-2xl shadow-inner">
            Espace privé sécurisé 🔐
          </div>

        </div>

        <div className="mt-12 text-sm text-gray-500">
          Comme à la maison, même loin de la maison.
        </div>

      </div>

    </div>
  );
}