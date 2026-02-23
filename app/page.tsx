export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-purple-900 mb-4">
          CALM by Angèle 💜
        </h1>
        <p className="text-gray-700 mb-6">
          Comme à la maison, même loin de la maison.
        </p>
        <a
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md transition"
        >
          Accéder au dashboard
        </a>
      </div>
    </div>
  );
}