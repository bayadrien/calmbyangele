"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { jsPDF } from "jspdf";
import SignatureCanvas from "react-signature-canvas";

type ContractType = {
  id: string;
  ownerId: string;
  dogId: string;
  dateDebut: any;
  dateFin: any;
  statut: string;
  signatureUrl?: string;
  contractNumber?: string;
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
      try {
        const res = await fetch("/api/get-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();

        // ⚡ IMPORTANT
        // Ton API doit maintenant retourner :
        // { contract, owner, dog }

        setContract(data.contract);
        setOwner(data.owner);
        setDog(data.dog);

      } catch (error) {
        console.error("Erreur récupération contrat:", error);
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
    "nomPrenom",
    "telephone",
    "nomAnimal",
    

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
      body: JSON.stringify({ image: signatureData, token }),
    });

    if (!response.ok) {
      alert("Erreur upload signature");
      return;
    }

    const data = await response.json();

    if (isFirstTime) {
    }

      const year = new Date().getFullYear();
      const contractNumber = `CALM-${year}-${contract.id.slice(0, 6).toUpperCase()}`;

    

    // ==========================
    // 🔹 GENERATION PDF
    // ==========================

    const pdf = new jsPDF();
    const pageHeight = 280;

    const checkPageBreak = (spaceNeeded = 10) => {
      if (y + spaceNeeded > pageHeight) {
        pdf.addPage();
        y = 15;
      }
    };
    
    const sectionTitle = (title: string) => {
      checkPageBreak(15);

      pdf.setFillColor(245, 243, 255);
      pdf.rect(15, y - 5, 180, 10, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(88, 28, 135);
      pdf.text(title, 20, y + 2);

      pdf.setTextColor(0);
      y += 12;
    };

    const addParagraph = (text: string) => {
  const lines = pdf.splitTextToSize(text, 170); // largeur max
  lines.forEach((line: string) => {
    checkPageBreak(8);
    pdf.text(line, 15, y);
    y += 6;
  });
};

    // Bandeau doux
    pdf.setFillColor(237, 231, 246);
    pdf.rect(0, 0, 210, 35, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(88, 28, 135);
    pdf.text("Comme À La Maison by Angèle", 105, 18, { align: "center" });

    pdf.setFontSize(13);
    pdf.setTextColor(90);
    pdf.text("Contrat initial de Pet-Sitting", 105, 26, { align: "center" });

    pdf.setTextColor(0);
    let y = 45;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text(`Contrat n° : ${contractNumber}`, 15, y);
    y += 8;

    pdf.text(`Date : ${new Date().toLocaleDateString()}`, 15, y);
    y += 12;

    // Propriétaire
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Propriétaire");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("Le présent contrat est conclu entre :");

    pdf.text(`Nom : ${formData.nomPrenom}`, 20, y); y += 6;
    pdf.text(`Téléphone : ${formData.telephone}`, 20, y); y += 6;
    pdf.text(`Email : ${formData.email}`, 20, y); y += 6;
    pdf.text(`Adresse : ${formData.adresse}`, 20, y); y += 10;

    addParagraph("Et La Pet-Sitter :");
    addParagraph("Angèle FRANCHIMONT");
    addParagraph("75J Avenue Anthony Caro");
    addParagraph("59630 Bourbourg");
    addParagraph("Téléphone : 06 34 76 34 49");

    // Animal
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Animal");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("Le propriétaire confie au Pet-Sitter l’animal suivant :");
    pdf.text(`Nom : ${formData.nomAnimal}`, 20, y); y += 6;
    pdf.text(`Espèce : ${formData.espece}`, 20, y); y += 6;
    pdf.text(`Race : ${formData.race}`, 20, y); y += 6;
    pdf.text(`Date de naissance : ${formData.dateNaissance}`, 20, y); y += 6;
    pdf.text(`Identification : ${formData.identification || "-"}`, 20, y); y += 10;

    // Lieu de Garde
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Lieu de garde");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("La garde pourra être effectuée soit au domicile du propriétaire, soit au domicile du Pet-Sitter.");
    addParagraph("La garde s’effectue à un seul animal à la fois, sauf s’il s’agit de plusieurs animaux appartenant au même propriétaire.");
    addParagraph("Pour des raisons de sécurité, les sorties se feront systématiquement en laisse.");
    pdf.text(`Nom : ${formData.lieuGarde}`, 20, y); y += 6;

    // Santé
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Santé et comportement");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("Le propriétaire déclare que l’animal confié est en bonne santé et communique l’ensemble des informations nécessaires à sa prise en charge. Toute omission d'information engage la responsabilité du propriétaire.");
    [
      ["L’animal est-il à jour de ses vaccins ?", formData.vaccins],
      ["L’animal est-il stérilisé ? ", formData.sterilise],
      ["A-t-il déjà mordu ?", formData.morsure],
      ["A-t-il déjà fugué ?", formData.fugue],
      ["Présente-t-il un comportement agressif ?", formData.agressif],
      ["Peut-il être manipulé sans difficulté ?", formData.manipulable],
      ["Peut-il vivre avec d'autres animaux ?", formData.peutVivreAutresAnimaux],
      ["Souffre-t-il d'une pathologie connue ?", formData.pathologieconnue],
      ["Précisez les pathologies :", formData.detailPathologie],
      ["Suit-il actuellement un traitement ?", formData.actutraitements],
      ["Précisez les traitements en cours :", formData.detailTraitement],
    ].forEach(([label, value]) => {
      if (value) {
        pdf.text(`${label} : ${value}`, 20, y);
        y += 6;
      }
    });

    y += 6;

    // Habitudes
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Habitudes");
    y += 6;
    pdf.setFont("helvetica", "normal");

    pdf.text(`Habitudes alimentaires (horaires, quantités, particularités) : ${formData.habitudesAlimentaires}`, 20, y, { maxWidth: 170 });
    y += 10;

    pdf.text(`Habitudes de vie (sommeil, promenades, peurs, rituels, etc...) : ${formData.habitudesVie}`, 20, y, { maxWidth: 170 });
    y += 15;

    // Urgence
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Urgence");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("En cas d’urgence vétérinaire, le Pet-Sitter est habilité à consulter un vétérinaire afin de préserver la santé et la sécurité de l’animal.");
    addParagraph("Le propriétaire s’engage à rembourser l’intégralité des frais vétérinaires engagés.");

    addParagraph("En cas d'urgence :");
    pdf.text(`Décision : ${formData.urgenceDecision}`, 20, y); y += 6;
    pdf.text(`Vétérinaire Référent: ${formData.veterinaire}`, 20, y); y += 6;
    
    addParagraph("Le contact d’urgence sera sollicité uniquement en cas d’indisponibilité téléphonique du propriétaire pour une situation urgente nécessitant une décision rapide.");
    addParagraph("Il est recommandé d’indiquer une personne disponible et distincte du propriétaire.");
    pdf.text(`Contact d'urgence : ${formData.contactUrgenceNom}`, 20, y); y += 6;
    pdf.text(`Téléphone du contact d'urgence : ${formData.contactUrgenceTel}`, 20, y); y += 12;

    // Paiements
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Conditions financières");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("Le paiement sera effectué en espèces à la fin de la prestation. Aucun acompte n’est demandé.");

    // Droit image
    pdf.setFont("helvetica", "bold");
    checkPageBreak(10);
    sectionTitle("Droit à l'image");
    y += 6;
    pdf.setFont("helvetica", "normal");

    addParagraph("Des photos et/ou vidéos de l’animal pourront être prises durant la garde uniquement dans le but de donner des nouvelles au propriétaire.");
    addParagraph("Aucune publication publique ne sera réalisée. Les images seront transmises exclusivement au propriétaire de l’animal.");

    pdf.text(`Autorisation : ${formData.autorisationPhoto}`, 20, y);
    y += 15;

    // Signature
    checkPageBreak(60);

    pdf.setFillColor(250, 245, 255);
    pdf.rect(15, y - 5, 180, 60, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(88, 28, 135);
    pdf.text("Signature électronique", 105, y + 5, { align: "center" });

    addParagraph("Je certifie que toutes les informations fournies sont exactes.");
    addParagraph("Je reconnais avoir pris connaissance des conditions de garde.");

    pdf.setTextColor(0);

    const signatureBase64 = sigRef.current.toDataURL("image/png");
    pdf.addImage(signatureBase64, "PNG", 75, y + 12, 60, 30);

    pdf.setFontSize(10);
    pdf.text(
      `Signé le ${new Date().toLocaleDateString()} à ${formData.villeSignature}`,
      105,
      y + 50,
      { align: "center" }
    );

  const pageCount = pdf.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text(
      "Comme À La Maison by Angèle - Bourbourg",
      105,
      290,
      { align: "center" }
    );
}

    // Convertir en blob
    const pdfBlob = pdf.output("blob");

    // Préparer upload
    const uploadData = new FormData();
    uploadData.append("file", pdfBlob, `contrat-${contractNumber}.pdf`);
    uploadData.append("upload_preset", "calm_unsigned");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    const uploadJson = await uploadRes.json();

    if (!uploadJson.secure_url) {
      alert("Erreur upload PDF");
      return;
    }

    const pdfUrl = uploadJson.secure_url;

    await fetch("/api/sign-contract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: contract.id,
        ownerId: owner.id,
        dogId: dog.id,
        signatureUrl: data.url,
        contractNumber,
        pdfUrl,
        formData,
        token,
      }),
    });

    await fetch("/api/notify-admin/contract-initial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogName: dog.nom,
        ownerName: owner.prenom + " " + owner.nom,
        token,
      }),
    });

    await fetch("/api/notify-client/contract-initial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogName: dog.nom,
        ownerName: owner.prenom + " " + owner.nom,
        ownerEmail: owner.email,
        token,
      }),
    });

  setSigned(true);
  };

return (
<div id="contract-content">
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
            <option value="Chien">Chien</option>
            <option value="Chat">Chat</option>
            <option value="Autre">Autres</option>
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
          <option value="Au domicile du propriétaire">
            Au domicile du propriétaire
          </option>
          <option value="Au domicile du Pet-Sitter">
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
            value: "J’autorise le Pet-Sitter à prendre toute décision médicale nécessaire",
            label:
              "J’autorise le Pet-Sitter à prendre toute décision médicale nécessaire",
          },
          {
            value: "Je souhaite être contacté avant toute décision",
            label:
              "Je souhaite être contacté avant toute décision",
          },
          {
            value: "Je délègue la décision à mon contact d’urgence",
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
        <option value="CV Florentine (Bourbourg) - Dr MANIEZ Laurence">CV Florentine (Bourbourg) - Dr MANIEZ Laurence</option>
        <option value="CV Florentine (Bourbourg) - Dr SCHLESSER Eleonore">CV Florentine (Bourbourg) - Dr   SCHLESSER Eleonore</option>
        <option value="CV des Lys (Loon-Plage) - Dr CLARYS Angélique">CV des Lys (Loon-Plage) - Dr CLARYS Angélique</option>
        <option value="CV des Lys (Loon-Plage) - Dr DEGRAVE Pélagie">CV des Lys (Loon-Plage) - Dr DEGRAVE Pélagie</option>
        <option value="CV de l’Aa (Gravelines) - Dr DANDRIFOSSE Jean-François">CV de l’Aa (Gravelines) - Dr DANDRIFOSSE Jean-François</option>
        <option value="CV de l’Aa (Gravelines) - Dr MONTAGNE Nathalie">CV de l’Aa (Gravelines) - Dr MONTAGNE Nathalie</option>
        <option value="CV Univet (Grande-Synthe) - Dr HAVEGEER Christian">CV Univet (Grande-Synthe) - Dr HAVEGEER Christian</option>
        <option value="CV Univet (Grande-Synthe) - Dr SCALA Arnaud">CV Univet (Grande-Synthe) - Dr SCALA Arnaud</option>
        <option value="CV d’Audruicq (Audruicq) - Dr KERCKHOVE Laurence">CV d’Audruicq (Audruicq) - Dr KERCKHOVE Laurence</option>
        <option value="CV d’Audruicq (Audruicq) - Dr LOISEAU Estelle">CV d’Audruicq (Audruicq) - Dr LOISEAU Estelle</option>
        <option value="CV des Capucines (Oye-Plage) - Dr MANIEZ Laurence">CV des Capucines (Oye-Plage) - Dr MANIEZ Laurence</option>
        <option value="CV des Capucines (Oye-Plage) - Dr SCHLESSER Eleonore">CV des Capucines (Oye-Plage) - Dr SCHLESSER Eleonore</option>
        <option value="Autre">Autre (à préciser directement au Pet-Sitter)</option>
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
          value="J’autorise l’envoi de photos/vidéos uniquement à mon usage privé"
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
          value="Je refuse toute prise d’image"
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
</div>
);
}
