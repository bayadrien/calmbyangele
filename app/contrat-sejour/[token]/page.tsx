"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";

export default function ContratSejourPage() {
  const params = useParams();
  const token = params?.token as string;

  const [contract, setContract] = useState<StayContractType | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [dog, setDog] = useState<any>(null);
  const [signed, setSigned] = useState(false);

  const sigRef = useRef<any>(null);

    type StayContractType = {
        id: string;
        ownerId: string;
        dogId: string;
        dateDebut: string;
        dateFin: string;
        statut: string;
        token: string;
        pdfUrl?: string;
        signatureUrl?: string;
        modalite: string;
        prix: string;
        notes: string;
        ville: string;
    };

  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "stayContracts"),
        where("token", "==", token)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0];
        const contractData = {id: data.id,...(data.data() as Omit<StayContractType, "id">),} as StayContractType;
        setContract(contractData);

        const ownerSnap = await getDoc(
          doc(db, "owners", contractData.ownerId)
        );
        if (ownerSnap.exists())
          setOwner({ id: ownerSnap.id, ...ownerSnap.data() });

        const dogSnap = await getDoc(
          doc(db, "dogs", contractData.dogId)
        );
        if (dogSnap.exists())
          setDog({ id: dogSnap.id, ...dogSnap.data() });
      }
    };

    fetchData();
  }, [token]);

  if (!contract || !owner || !dog)
    return <div className="p-10">Chargement...</div>;

  if (signed || contract.statut === "signé") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-green-600">
          ✅ Séjour signé avec succès
        </h1>
      </div>
    );
  }

  const handleSign = async () => {
    // ======================
    // PDF AVENANT DE SEJOUR
    // ======================

    const pdf = new jsPDF();
    let y = 20;
    const pageHeight = 280;

    const checkPageBreak = (space = 10) => {
    if (y + space > pageHeight) {
        pdf.addPage();
        y = 20;
    }
    };

    const addLine = (text: string, bold = false) => {
    checkPageBreak(8);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.text(text, 20, y);
    y += 7;
    };

    const addParagraph = (text: string) => {
    const lines = pdf.splitTextToSize(text, 170);
    lines.forEach((line: string) => {
        checkPageBreak(8);
        pdf.text(line, 20, y);
        y += 6;
    });
    y += 4;
    };

    // 🔹 HEADER
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(
    "Comme à la maison by Angèle – Avenant de séjour",
    105,
    y,
    { align: "center" }
    );

    y += 15;

    // ==========================
    // 1️⃣ INFORMATIONS
    // ==========================

    addLine("1️⃣ Informations", true);

    addLine(
    `Coordonnées du propriétaire : ${owner.prenom} ${owner.nom}`
    );

    addLine(
    `Animal : ${dog.nom} - ${dog.type || "-"} - ${dog.race || "-"} - ${dog.dateNaissance || "-"}`
    );

    y += 5;

    // ==========================
    // 2️⃣ CLAUSE DE RATTACHEMENT
    // ==========================

    addLine("2️⃣ Clause de rattachement", true);

    addParagraph(
    "Le présent document constitue un avenant au contrat signé initialement."
    );

    addParagraph(
    "L’ensemble des clauses, conditions générales et responsabilités définies dans le contrat initial demeurent applicables."
    );

    // ==========================
    // 3️⃣ DÉTAILS DU SEJOUR
    // ==========================

    addLine("3️⃣ Détails du séjour concerné", true);

    addLine(
    `Dates : du ${new Date(contract.dateDebut).toLocaleDateString()} au ${new Date(contract.dateFin).toLocaleDateString()}`
    );

    addLine(`Modalité de garde : ${contract.modalite || "-"}`);
    addLine(`Tarif total : ${contract.prix || "-"} €`);
    addLine(
    `Changements depuis la dernière garde : ${contract.notes || "Aucun"}`
    );

    y += 5;

    // ==========================
    // 4️⃣ DÉCLARATION
    // ==========================

    addLine("4️⃣ Déclaration du propriétaire", true);

    addParagraph(
    "Je confirme que les informations médicales et comportementales transmises lors du contrat initial sont toujours exactes."
    );

    addParagraph(
    "Je déclare que toute modification éventuelle a été signalée dans le présent document."
    );

    // ==========================
    // 5️⃣ SIGNATURE
    // ==========================

    addLine("5️⃣ Signature", true);

    checkPageBreak(50);

    pdf.text(
    `Fait le ${new Date().toLocaleDateString()} à ${contract.ville || "-"}`,
    20,
    y
    );

    y += 15;

    const signatureBase64 = sigRef.current.toDataURL("image/png");

    pdf.addImage(signatureBase64, "PNG", 20, y, 60, 30);

    y += 40;

    pdf.setFontSize(10);
    pdf.text("Signature du propriétaire", 20, y);

    // Convertir en blob
    const pdfBlob = pdf.output("blob");

    // Upload Cloudinary
    const formData = new FormData();
    formData.append(
      "file",
      pdfBlob,
      `sejour-${dog.nom}-${Date.now()}.pdf`
    );
    formData.append("upload_preset", "calm_unsigned");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadJson = await uploadRes.json();

    if (!uploadJson.secure_url) {
      alert("Erreur upload PDF");
      return;
    }

    // Mettre à jour Firestore
    await updateDoc(doc(db, "stayContracts", contract.id), {
      statut: "signé",
      signatureUrl: signatureBase64,
      pdfUrl: uploadJson.secure_url,
      signedAt: new Date(),
    });

    setSigned(true);
  };

  return (
    <div className="min-h-screen bg-purple-50 py-12 px-6 flex justify-center">
        <div className="bg-white shadow-2xl rounded-3xl p-12 max-w-4xl w-full space-y-10">

        {/* HEADER */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-purple-900">
            Comme à la maison by Angèle
            </h1>
            <p className="text-xl font-semibold text-purple-700">
            Avenant de séjour
            </p>
        </div>

        {/* 1️⃣ INFORMATIONS */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-800 border-b pb-2">
            1️⃣ Informations
            </h2>

            <div className="bg-purple-50 p-6 rounded-2xl space-y-2">
            <p>
                <strong>Propriétaire :</strong> {owner.prenom} {owner.nom}
            </p>
            <p>
                <strong>Animal :</strong> {dog.nom}
            </p>
            <p>
                <strong>Type :</strong> {dog.type || "-"}
            </p>
            <p>
                <strong>Race :</strong> {dog.race || "-"}
            </p>
            <p>
                <strong>Date de naissance :</strong>{" "}
                {dog.dateNaissance || "-"}
            </p>
            </div>
        </section>

        {/* 2️⃣ CLAUSE */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-800 border-b pb-2">
            2️⃣ Clause de rattachement
            </h2>

            <p className="text-gray-700 leading-relaxed">
            Le présent document constitue un avenant au contrat signé
            initialement.
            </p>

            <p className="text-gray-700 leading-relaxed">
            L’ensemble des clauses, conditions générales et responsabilités
            définies dans le contrat initial demeurent pleinement applicables.
            </p>
        </section>

        {/* 3️⃣ DÉTAILS */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-800 border-b pb-2">
            3️⃣ Détails du séjour concerné
            </h2>

            <div className="bg-purple-50 p-6 rounded-2xl space-y-2">
            <p>
                <strong>Dates :</strong>{" "}
                Du {new Date(contract.dateDebut).toLocaleDateString()} au{" "}
                {new Date(contract.dateFin).toLocaleDateString()}
            </p>

            <p>
                <strong>Modalité de garde :</strong>{" "}
                {contract.modalite || "-"}
            </p>

            <p>
                <strong>Tarif total :</strong>{" "}
                {contract.prix || "-"} €
            </p>

            <p>
                <strong>Changements depuis la dernière garde :</strong>{" "}
                {contract.notes || "Aucun"}
            </p>
            </div>
        </section>

        {/* 4️⃣ DÉCLARATION */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-800 border-b pb-2">
            4️⃣ Déclaration du propriétaire
            </h2>

            <p className="text-gray-700 leading-relaxed">
            Je confirme que les informations médicales et comportementales
            transmises lors du contrat initial sont toujours exactes.
            </p>

            <p className="text-gray-700 leading-relaxed">
            Toute modification a été signalée dans le présent document.
            </p>
        </section>

        {/* 5️⃣ SIGNATURE */}
        <section className="space-y-6">
            <h2 className="text-xl font-semibold text-purple-800 border-b pb-2">
            5️⃣ Signature
            </h2>

            <p>
            Fait le {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-2">
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl w-full"
            >
            Signer le séjour
            </button>
        </section>

        </div>
    </div>
    );
}