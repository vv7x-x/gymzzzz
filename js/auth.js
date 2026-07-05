import { supabase } from './supabase.js';
import { getErrorMessage } from './utils.js';

export async function signIn(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (e) {
    console.error('Sign out error:', e);
  }
}

export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export function onAuthChange(callback) {
  if (typeof callback !== 'function') return;
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

export async function signUp(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}
