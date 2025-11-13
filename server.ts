import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API endpoint cho audit logs
app.post('/api/audit-log', async (req, res) => {
  try {
    const { ticketId, userId, role, action, details, timestamp } = req.body;

    if (!ticketId || !userId || !role || !action || !details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error, data } = await supabaseAdmin.from('audit_logs').insert({
      ticket_id: ticketId,
      user_id: userId,
      role,
      action,
      details,
      timestamp: timestamp || new Date().toISOString(),
    }).select();

    if (error) {
      console.error('Audit log insert error:', error);
      return res.status(500).json({ error: error.message, code: error.code });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint cho messages
app.post('/api/messages', async (req, res) => {
  try {
    const { id, ticket_id, sender_id, content, original_content, status, timestamp } = req.body;

    if (!id || !ticket_id || !sender_id || !content || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error, data } = await supabaseAdmin
      .from('messages')
      .insert({
        id,
        ticket_id,
        sender_id,
        content,
        original_content: original_content || content,
        status,
        timestamp: timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Insert message error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

