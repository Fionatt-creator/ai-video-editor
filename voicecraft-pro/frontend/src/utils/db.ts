/****************************
 * VoiceCraft Pro - IndexedDB 存储 (Dexie)
 ****************************/
import Dexie, { Table } from 'dexie';
import { Project } from '../types';

export interface ProjectRecord {
  id: string;
  name: string;
  data: Project;
  updatedAt: number;
}

export interface AudioBlobRecord {
  id: string;
  projectId: string;
  blob: Blob;
  duration: number;
  createdAt: number;
}

export interface VoiceCacheRecord {
  voiceId: string;
  provider: string;
  data: string;
  updatedAt: number;
}

class VoiceCraftDB extends Dexie {
  projects!: Table<ProjectRecord>;
  audioBlobs!: Table<AudioBlobRecord>;
  voiceCache!: Table<VoiceCacheRecord>;

  constructor() {
    super('VoiceCraftDB');
    this.version(1).stores({
      projects: 'id, name, updatedAt',
      audioBlobs: 'id, projectId, createdAt',
      voiceCache: 'voiceId, provider, updatedAt',
    });
  }
}

export const db = new VoiceCraftDB();

export async function saveProjectToDB(project: Project): Promise<void> {
  await db.projects.put({
    id: project.id,
    name: project.name,
    data: project,
    updatedAt: Date.now(),
  });
}

export async function loadProjectFromDB(projectId: string): Promise<Project | null> {
  const record = await db.projects.get(projectId);
  return record?.data ?? null;
}

export async function listProjectsFromDB(): Promise<ProjectRecord[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function deleteProjectFromDB(projectId: string): Promise<void> {
  await db.projects.delete(projectId);
  await db.audioBlobs.where('projectId').equals(projectId).delete();
}

export async function saveAudioBlob(blobId: string, projectId: string, blob: Blob, duration: number): Promise<void> {
  await db.audioBlobs.put({
    id: blobId,
    projectId,
    blob,
    duration,
    createdAt: Date.now(),
  });
}

export async function getAudioBlob(blobId: string): Promise<Blob | null> {
  const record = await db.audioBlobs.get(blobId);
  return record?.blob ?? null;
}

export async function getAudioUrl(blobId: string): Promise<string | null> {
  const blob = await getAudioBlob(blobId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteAudioBlob(blobId: string): Promise<void> {
  await db.audioBlobs.delete(blobId);
}
