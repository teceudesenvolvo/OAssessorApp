import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../ApiConfig';

const normalize = snapshot => snapshot.exists()
  ? { id: snapshot.id, ...snapshot.data() }
  : null;

export async function getCollection(name, filters = []) {
  const collectionRef = collection(db, name);
  const source = filters.length
    ? query(collectionRef, ...filters.map(([field, value]) => where(field, '==', value)))
    : collectionRef;
  const snapshot = await getDocs(source);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function getDocument(name, id) {
  return normalize(await getDoc(doc(db, name, id)));
}

export async function addDocument(name, data) {
  return addDoc(collection(db, name), data);
}

export async function updateDocument(name, id, data) {
  return updateDoc(doc(db, name, id), data);
}

export async function deleteDocument(name, id) {
  return deleteDoc(doc(db, name, id));
}

export async function addNestedDocument(name, id, childCollection, data) {
  const parent = await getDocument(name, id);
  const items = parent?.[childCollection] || {};
  const generatedId = doc(collection(db, '_ids')).id;
  await updateDocument(name, id, { [childCollection]: { ...items, [generatedId]: data } });
  return { id: generatedId };
}

export async function getNestedDocuments(name, id, childCollection) {
  const parent = await getDocument(name, id);
  const items = parent?.[childCollection];
  return items ? Object.entries(items).map(([itemId, data]) => ({ id: itemId, ...data })) : [];
}

export async function updateNestedDocument(name, id, childCollection, childId, data) {
  const parent = await getDocument(name, id);
  const items = parent?.[childCollection] || {};
  return updateDocument(name, id, { [childCollection]: { ...items, [childId]: { ...items[childId], ...data } } });
}
