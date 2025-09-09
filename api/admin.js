import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { action, username, password, page = 1, limit = 5, id, status } = req.body;

  try {
    // ----------------------
    // Admin Login
    // ----------------------
    if (action === 'login') {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // ----------------------
    // Get Resumes with Pagination
    // ----------------------
    if (action === 'getResumes') {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from('resumes')
        .select('id, name, email, resume_link, query, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return res.status(200).json({ resumes: data, total: count });
    }

    // ----------------------
    // Update Resume Status (Complete / Undo)
    // ----------------------
    if (action === 'updateStatus') {
      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'Missing id or status' });
      }

      const { error } = await supabase
        .from('resumes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, status });
    }

    // ----------------------
    // Invalid Action
    // ----------------------
    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
