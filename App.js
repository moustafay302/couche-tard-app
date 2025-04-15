import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzPbcAvfYoLZSy8cqAOuuox4PVcZ4vNwM",
  authDomain: "couche-tard-103.firebaseapp.com",
  projectId: "couche-tard-103",
  storageBucket: "couche-tard-103.appspot.com",
  messagingSenderId: "120478157280",
  appId: "1:120478157280:web:8349a1749f9e3a0063c385",
  measurementId: "G-K9LSY57RMG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [comment, setComment] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const fetched = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(fetched);
    };
    fetchTasks();
  }, []);

  const handleClaim = async (id) => {
    setSelectedTaskId(id);
    await updateDoc(doc(db, "tasks", id), { claimedBy: name });
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, claimedBy: name } : task
      )
    );
  };

  const handleSubmit = async () => {
    const photoRef = ref(storage, `photos/${photo.name}`);
    await uploadBytes(photoRef, photo);
    const photoURL = await getDownloadURL(photoRef);

    await updateDoc(doc(db, "tasks", selectedTaskId), {
      photoURL,
      comment,
      status: "submitted",
    });

    setTasks(
      tasks.map((task) =>
        task.id === selectedTaskId ? { ...task, photoURL, comment, status: "submitted" } : task
      )
    );

    alert("Tâche soumise avec succès !");
    setPhoto(null);
    setComment("");
    setSelectedTaskId(null);
  };

  const handleValidation = async (id, decision) => {
    await updateDoc(doc(db, "tasks", id), { status: decision });
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, status: decision } : task
      )
    );
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Tâches du jour</h1>
      <input
        placeholder="Ton prénom"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {tasks.map((task) => (
        <div key={task.id} style={{ border: "1px solid #ccc", padding: 10, margin: 10 }}>
          <p><strong>{task.title}</strong></p>
          {task.claimedBy && <p>Réservée par {task.claimedBy}</p>}
          {task.status === "submitted" && (
            <div>
              <p>Commentaire : {task.comment}</p>
              <img src={task.photoURL} alt="preuve" style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
              <button onClick={() => handleValidation(task.id, "acceptée")}>Accepter</button>
              <button onClick={() => handleValidation(task.id, "refusée")}>Refuser</button>
            </div>
          )}
          {task.status === "acceptée" && <p style={{ color: "green" }}>Tâche acceptée</p>}
          {task.status === "refusée" && <p style={{ color: "red" }}>Tâche refusée</p>}
          {!task.claimedBy && (
            <button onClick={() => handleClaim(task.id)} disabled={!name}>
              Prendre la tâche
            </button>
          )}
        </div>
      ))}
      {selectedTaskId && (
        <div>
          <h2>Soumettre la tâche</h2>
          <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
          <textarea
            placeholder="Commentaire"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={!photo || !comment}>
            Soumettre
          </button>
        </div>
      )}
    </div>
  );
}
