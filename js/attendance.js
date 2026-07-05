import { supabase } from './supabase.js';
import { sanitize } from './utils.js';

async function doCheckIn(memberId) {
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('check_in_date', today)
    .maybeSingle();

  if (existing) return { alreadyCheckedIn: true };

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const { error: insertErr } = await supabase.from('attendance').insert({
    member_id: memberId,
    check_in_date: today,
    check_in_time: timeStr,
  });
  if (insertErr) throw insertErr;
  return { alreadyCheckedIn: false };
}

export async function checkIn(code) {
  if (!code) return { success: false, msg: 'No code provided' };
  try {
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('code', code)
      .single();
    if (memberErr || !member) return { success: false, msg: 'Member not found' };

    const result = await doCheckIn(member.id);
    if (result.alreadyCheckedIn) return { success: false, msg: `${sanitize(member.full_name)} — already checked in today` };

    return { success: true, member: member, msg: `${sanitize(member.full_name)} — Checked in successfully` };
  } catch (e) {
    return { success: false, msg: e.message || 'Check-in failed' };
  }
}

export async function checkInById(memberId) {
  if (!memberId) return { success: false, msg: 'No member ID', member: null };
  try {
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, full_name, photo_url, member_id')
      .eq('id', memberId)
      .single();
    if (memberErr || !member) return { success: false, msg: 'Member not found', member: null };

    const result = await doCheckIn(member.id);
    if (result.alreadyCheckedIn) return { success: false, msg: `${sanitize(member.full_name)} — already checked in today`, member };

    return { success: true, member, msg: `${sanitize(member.full_name)} — Checked in successfully` };
  } catch (e) {
    return { success: false, msg: e.message || 'Check-in failed', member: null };
  }
}

export async function getTodayAttendance() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*, members(full_name, code, photo_url)')
      .eq('check_in_date', today)
      .order('check_in_time', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getAttendanceByMember(memberId, limit) {
  if (!memberId) return [];
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('check_in_date', { ascending: false })
      .limit(limit || 30);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getAttendanceCountToday() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('check_in_date', today);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}
