"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import SignatureCanvas from "react-signature-canvas";

type ContractType = {
  id: string;
  ownerId: string;
  dogId: string;
  dateDebut: any;
  dateFin: any;
  statut: string;
  signatureUrl?: string;
};

export default function ContratPage() {
  const params = useParams();
  const token = params?.token as string;

  const [contract, setContract] = useState<ContractType | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [dog, setDog] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);

  const [formData, setFormData] = useState({
    adresse: "",
    nomPrenom: "",
    telephone: "",
    email: "",
    identification: "",
    nomAnimal: "",
    espece: "",
    race: "",
    dateNaissance: "",
    lieuGarde: "",
    vaccins: "",
    sterilise: "",
    morsure: "",
    fugue: "",
    agressif: "",
    manipulable: "",
    pathologie: "",
    traitement: "",
    chienCategorie: "",
    assuranceCategorie: "",
    peutVivreAutresAnimaux: "",
    veterinaire: "",
    contactUrgenceNom: "",
    contactUrgenceTel: "",
    allergies: "",
    traitements: "",
    habitudes: "",
    autorisationPhoto: "",
    urgenceDecision: "",
    actutraitements: "",
    pathologieconnue: "",
    detailPathologie: "",
    detailTraitement: "",
    habitudesAlimentaires: "",
    habitudesVie: "",
    villeSignature: "",
    certification: false,

  });

  const sigRef = useRef<any>(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      const q = query(collection(db, "contracts"), where("token", "==", token));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const contractData = {
          id: snapshot.docs[0].id,
          ...(snapshot.docs[0].data() as Omit<ContractType, "id">),
        } as ContractType;

        setContract(contractData);

        const ownerSnap = await getDoc(doc(db, "owners", contractData.ownerId));
        if (ownerSnap.exists())
          setOwner({ id: ownerSnap.id, ...ownerSnap.data() });

        const dogSnap = await getDoc(doc(db, "dogs", contractData.dogId));
        if (dogSnap.exists())
          setDog({ id: dogSnap.id, ...dogSnap.data() });
      }

      setLoading(false);
    };

    fetchData();
  }, [token]);

  if (loading) return <div className="p-10">Chargement...</div>;
  if (!contract) return <div className="p-10">Contrat introuvable.</div>;
  if (!owner || !dog) return <div className="p-10">Chargement...</div>;

  if (signed || contract.statut === "signé") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            ✅ Contrat signé avec succès !
          </h1>
        </div>
      </div>
    );
  }

  const isFirstTime = !owner.contratGeneralValide;

  const requiredFields = [
    "adresse",
    "nomPrenom",
    "adresse",
    "telephone",
    "nomAnimal",
    "actutraitements",
    "pathologieconnue",
    "espece",
    "race",
    "dateNaissance",
    "email",
    "lieuGarde",
    "vaccins",
    "sterilise",
    "morsure",
    "fugue",
    "agressif",
    "manipulable",
    "pathologie",
    "traitement",
    "chienCategorie",
    "peutVivreAutresAnimaux",
    "veterinaire",
    "contactUrgenceNom",
    "contactUrgenceTel",
    "autorisationPhoto",
    "urgenceDecision",

  ];

  const handleSign = async () => {
    if (!contract) return;

    if (isFirstTime) {
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          alert("Veuillez remplir tous les champs obligatoires.");
          return;
        }
      }

      if (
        formData.chienCategorie === "oui" &&
        !formData.assuranceCategorie
      ) {
        alert("Assurance obligatoire pour chien catégorisé.");
        return;
      }
    }
     if (!formData.certification) {
     alert("Veuillez certifier les informations.");
     return;
        }

        if (!formData.villeSignature) {
        alert("Veuillez indiquer la ville de signature.");
        return
        }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Veuillez signer avant de valider.");
      return;
    }
    if (formData.pathologieconnue === "oui" && !formData.detailPathologie) return;
    if (formData.actutraitements === "oui" && !formData.detailTraitement) return;

    const signatureData = sigRef.current.toDataURL();

    const response = await fetch("/api/upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: signatureData }),
    });

    if (!response.ok) {
      alert("Erreur upload signature");
      return;
    }

    const data = await response.json();

    if (isFirstTime) {
      await updateDoc(doc(db, "owners", owner.id), {
        adresse: formData.adresse,
        contratGeneralValide: true,
        contratVersion: "v1",
      });

      await updateDoc(doc(db, "dogs", dog.id), {
        ...formData,
      });
    }

    await updateDoc(doc(db, "contracts", contract.id), {
      statut: "signé",
      signatureUrl: data.url,
      signedAt: new Date(),
    });

    setSigned(true);
  };

return (
  <div className="min-h-screen bg-purple-50 py-12 px-6 flex justify-center">
    <div className="bg-white shadow-2xl rounded-3xl p-12 max-w-4xl w-full space-y-12">

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-purple-900">
          Contrat Général de Pet-Sitting
        </h1>
        <p className="text-gray-600">
          Comme A La Maison by Angèle – Bourbourg
        </p>
      </div>

{/* SECTION 1 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    1. Identification des parties
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      Le présent contrat est conclu entre :
    </p>

    {/* PROPRIETAIRE */}
    <div className="bg-purple-50 p-6 rounded-2xl space-y-4">
      <h3 className="font-semibold text-lg text-purple-900">
        Le Propriétaire :
      </h3>

      {isFirstTime && (
        <>
          <input
            placeholder="Nom / Prénom *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, nomPrenom: e.target.value })
            }
          />

          <input
            placeholder="Adresse complète *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, adresse: e.target.value })
            }
          />

          <input
            placeholder="Téléphone *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, telephone: e.target.value })
            }
          />

          <input
            placeholder="Email *"
            type="email"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </>
      )}
    </div>

    {/* PET SITTER */}
    <div className="bg-gray-50 p-6 rounded-2xl space-y-2">
      <h3 className="font-semibold text-lg text-purple-900">
        Le Pet-Sitter :
      </h3>

      <p>Angèle FRANCHIMONT</p>
      <p>75J Avenue Anthony Caro</p>
      <p>59630 Bourbourg</p>
      <p>Téléphone : 06 34 76 34 49</p>
    </div>

  </div>
</section>

{/* SECTION 2 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    2. Identification de l’animal
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      Le propriétaire confie au Pet-Sitter l’animal suivant :
    </p>

    <div className="bg-purple-50 p-6 rounded-2xl space-y-4">

      {isFirstTime && (
        <>
          <input
            placeholder="Nom de l’animal *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, nomAnimal: e.target.value })
            }
          />

          <select
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, espece: e.target.value })
            }
          >
            <option value="">Espèce *</option>
            <option value="chien">Chien</option>
            <option value="chat">Chat</option>
            <option value="autre">Autres</option>
          </select>

          <input
            placeholder="Race *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, race: e.target.value })
            }
          />

          <input
            type="date"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, dateNaissance: e.target.value })
            }
          />

          <input
            placeholder="Numéro d’identification (puce/tatouage)"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({ ...formData, identification: e.target.value })
            }
          />
        </>
      )}

    </div>
  </div>
</section>

{/* SECTION 3 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    3. Lieu et modalités de garde
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      La garde pourra être effectuée soit au domicile du propriétaire,
      soit au domicile du Pet-Sitter.
    </p>

    <p>
      La garde s’effectue à un seul animal à la fois, sauf s’il s’agit
      de plusieurs animaux appartenant au même propriétaire.
    </p>

    <p>
      Pour des raisons de sécurité, les sorties se feront
      systématiquement en laisse.
    </p>

    {isFirstTime && (
      <div className="bg-purple-50 p-6 rounded-2xl">
        <select
          className="border p-4 rounded-xl w-full"
          onChange={(e) =>
            setFormData({ ...formData, lieuGarde: e.target.value })
          }
        >
          <option value="">Choisir le lieu de garde *</option>
          <option value="domicileProprietaire">
            Au domicile du propriétaire
          </option>
          <option value="domicilePetSitter">
            Au domicile du Pet-Sitter
          </option>
        </select>
      </div>
    )}
  </div>
</section>

      {/* SECTION 4 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    4. Santé et comportement
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      Le propriétaire déclare que l’animal confié est en bonne santé
      et communique l’ensemble des informations nécessaires à sa prise en charge.
      Toute omission d'information engage la responsabilité du propriétaire.
    </p>

    {[
      { key: "vaccins", label: "L’animal est-il à jour de ses vaccins ? *" },
      { key: "sterilise", label: "L’animal est-il stérilisé ? *" },
      { key: "morsure", label: "A-t-il déjà mordu ? *" },
      { key: "fugue", label: "A-t-il déjà fugué ? *" },
      { key: "agressif", label: "Présente-t-il un comportement agressif ? *" },
      { key: "manipulable", label: "Peut-il être manipulé sans difficulté ? *" },
      { key: "peutVivreAutresAnimaux", label: "Peut-il vivre avec d'autres animaux ? *" },
    ].map((question) => (
      <div key={question.key} className="space-y-2">
        <p className="font-medium">{question.label}</p>
        <div className="flex gap-6">
          <label>
            <input
              type="radio"
              name={question.key}
              value="oui"
              onChange={(e) =>
                setFormData({ ...formData, [question.key]: e.target.value })
              }
            />{" "}
            Oui
          </label>
          <label>
            <input
              type="radio"
              name={question.key}
              value="non"
              onChange={(e) =>
                setFormData({ ...formData, [question.key]: e.target.value })
              }
            />{" "}
            Non
          </label>
        </div>
      </div>
    ))}

    {/* PATHOLOGIE */}
    <div className="space-y-2">
      <p className="font-medium">
        Souffre-t-il d'une pathologie connue ? *
      </p>
      <div className="flex gap-6">
        <label>
          <input
            type="radio"
            name="pathologieconnue"
            value="oui"
            onChange={(e) =>
              setFormData({ ...formData, pathologieconnue: e.target.value })
            }
          />{" "}
          Oui
        </label>
        <label>
          <input
            type="radio"
            name="pathologieconnue"
            value="non"
            onChange={(e) =>
              setFormData({ ...formData, pathologieconnue: e.target.value })
            }
          />{" "}
          Non
        </label>
      </div>

      {formData.pathologieconnue === "oui" && (
        <textarea
          placeholder="Précisez les pathologies *"
          className="border p-4 rounded-xl w-full"
          onChange={(e) =>
            setFormData({ ...formData, detailPathologie: e.target.value })
          }
        />
      )}
    </div>

    {/* TRAITEMENT */}
    <div className="space-y-2">
      <p className="font-medium">
        Suit-il actuellement un traitement ? *
      </p>
      <div className="flex gap-6">
        <label>
          <input
            type="radio"
            name="actutraitements"
            value="oui"
            onChange={(e) =>
              setFormData({ ...formData, actutraitements: e.target.value })
            }
          />{" "}
          Oui
        </label>
        <label>
          <input
            type="radio"
            name="actutraitements"
            value="non"
            onChange={(e) =>
              setFormData({ ...formData, actutraitements: e.target.value })
            }
          />{" "}
          Non
        </label>
      </div>

      {formData.actutraitements === "oui" && (
        <textarea
          placeholder="Précisez les traitements en cours *"
          className="border p-4 rounded-xl w-full"
          onChange={(e) =>
            setFormData({ ...formData, detailTraitement: e.target.value })
          }
        />
      )}
    </div>

    {/* HABITUDES */}
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-purple-900">
        Informations complémentaires
      </h3>

      <textarea
        placeholder="Habitudes alimentaires (horaires, quantités, particularités) *"
        className="border p-4 rounded-xl w-full min-h-[120px]"
        onChange={(e) =>
          setFormData({ ...formData, habitudesAlimentaires: e.target.value })
        }
      />

      <textarea
        placeholder="Habitudes de vie (sommeil, promenades, peurs, rituels, etc.) *"
        className="border p-4 rounded-xl w-full min-h-[120px]"
        onChange={(e) =>
          setFormData({ ...formData, habitudesVie: e.target.value })
        }
      />
    </div>

  </div>
</section>

{/* SECTION 5 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    5. Urgence vétérinaire
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      En cas d’urgence vétérinaire, le Pet-Sitter est habilité à consulter
      un vétérinaire afin de préserver la santé et la sécurité de l’animal.
    </p>

    <p>
      Le propriétaire s’engage à rembourser l’intégralité des frais
      vétérinaires engagés.
    </p>

    {/* CHOIX DECISION URGENCE */}
    <div className="space-y-4 bg-purple-50 p-6 rounded-2xl">
      <p className="font-semibold">
        En cas d’urgence :
      </p>

      <div className="space-y-2">
        {[
          {
            value: "decisionLibre",
            label:
              "J’autorise le Pet-Sitter à prendre toute décision médicale nécessaire",
          },
          {
            value: "meContacter",
            label:
              "Je souhaite être contacté avant toute décision",
          },
          {
            value: "delegationContact",
            label:
              "Je délègue la décision à mon contact d’urgence",
          },
        ].map((option) => (
          <label key={option.value} className="block">
            <input
              type="radio"
              name="urgenceDecision"
              value={option.value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  urgenceDecision: e.target.value,
                })
              }
            />{" "}
            {option.label}
          </label>
        ))}
      </div>
    </div>

    {/* VETERINAIRE */}
    {isFirstTime && (
      <select
        className="border p-4 rounded-xl w-full"
        onChange={(e) =>
          setFormData({ ...formData, veterinaire: e.target.value })
        }
      >
        <option value="">Choisir le vétérinaire référent *</option>
        <option value="veto1">Clinique vétérinaire 1</option>
        <option value="veto2">Clinique vétérinaire 2</option>
      </select>
    )}

    {/* CONTACT URGENCE */}
    <div className="space-y-4">
      <p className="text-gray-700">
        Le contact d’urgence sera sollicité uniquement en cas
        d’indisponibilité téléphonique du propriétaire pour une situation
        urgente nécessitant une décision rapide.
      </p>

      <p className="text-gray-700">
        Il est recommandé d’indiquer une personne disponible et distincte
        du propriétaire.
      </p>

      {isFirstTime && (
        <>
          <input
            placeholder="Nom du contact d'urgence *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({
                ...formData,
                contactUrgenceNom: e.target.value,
              })
            }
          />

          <input
            placeholder="Téléphone du contact d'urgence *"
            className="border p-4 rounded-xl w-full"
            onChange={(e) =>
              setFormData({
                ...formData,
                contactUrgenceTel: e.target.value,
              })
            }
          />
        </>
      )}
    </div>

  </div>
</section>

      {/* SECTION 6 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
          6. Conditions financières
        </h2>

        <p className="text-gray-700 leading-relaxed">
          Le paiement sera effectué en espèces à la fin de la prestation.
          Aucun acompte n’est demandé.
        </p>
      </section>

      {/* SECTION 7 */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    7. Droit à l’image
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      Des photos et/ou vidéos de l’animal pourront être prises durant la garde
      uniquement dans le but de donner des nouvelles au propriétaire.
    </p>

    <p>
      Aucune publication publique ne sera réalisée. Les images seront
      transmises exclusivement au propriétaire de l’animal.
    </p>

    <div className="bg-purple-50 p-6 rounded-2xl space-y-4">

      <label className="block">
        <input
          type="radio"
          name="autorisationPhoto"
          value="oui"
          onChange={(e) =>
            setFormData({
              ...formData,
              autorisationPhoto: e.target.value,
            })
          }
        />{" "}
        J’autorise l’envoi de photos/vidéos uniquement à mon usage privé
      </label>

      <label className="block">
        <input
          type="radio"
          name="autorisationPhoto"
          value="non"
          onChange={(e) =>
            setFormData({
              ...formData,
              autorisationPhoto: e.target.value,
            })
          }
        />{" "}
        Je refuse toute prise d’image
      </label>

    </div>

  </div>
</section>


      {/* SIGNATURE */}
<section className="space-y-8">
  <h2 className="text-2xl font-semibold text-purple-800 border-b pb-2">
    Signature
  </h2>

  <div className="space-y-6 text-gray-800 leading-relaxed">

    <p>
      Fait le{" "}
      <span className="font-semibold">
        {new Date().toLocaleDateString("fr-FR")}
      </span>
    </p>

    {isFirstTime && (
      <input
        placeholder="Ville de signature *"
        className="border p-4 rounded-xl w-full"
        onChange={(e) =>
          setFormData({ ...formData, villeSignature: e.target.value })
        }
      />
    )}

    <div className="bg-purple-50 p-6 rounded-2xl space-y-4">

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          onChange={(e) =>
            setFormData({
              ...formData,
              certification: e.target.checked,
            })
          }
        />
        <span>
          Je certifie que toutes les informations fournies sont exactes.
          <br />
          Je reconnais avoir pris connaissance des conditions de garde.
        </span>
      </label>

    </div>

    <div className="space-y-2">
      <p className="font-semibold">Signature électronique :</p>

      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          className: "border rounded-xl w-full h-40",
        }}
      />
    </div>

    <button
      onClick={handleSign}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition w-full"
    >
      Signer le contrat
    </button>

  </div>
</section>

    </div>
  </div>
);
}