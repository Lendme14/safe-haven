import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  safety_event_id: string;
  alert_type: 'activation' | 'deactivation' | 'check_in_missed';
  user_id: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AlertRequest = await req.json();
    const { safety_event_id, alert_type, user_id, location } = body;

    console.log(`Processing ${alert_type} alert for user ${user_id}, event ${safety_event_id}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const userName = profile?.display_name || 'Someone';

    // Get trusted contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('trusted_contacts')
      .select('id, name, email, phone')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      throw new Error('Failed to fetch trusted contacts');
    }

    if (!contacts || contacts.length === 0) {
      console.log('No trusted contacts found');
      return new Response(
        JSON.stringify({ success: true, message: 'No contacts to alert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build alert message based on type
    let subject: string;
    let message: string;
    
    switch (alert_type) {
      case 'activation':
        subject = `🚨 Safety Alert: ${userName} needs help`;
        message = `${userName} has activated their safety mode on Sentri. They may need assistance.`;
        if (location) {
          message += `\n\nLast known location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        }
        break;
      case 'deactivation':
        subject = `✅ ${userName} is safe`;
        message = `${userName} has deactivated their safety mode. They've indicated they are safe.`;
        break;
      case 'check_in_missed':
        subject = `⚠️ ${userName} missed their check-in`;
        message = `${userName} did not check in on time via Sentri. You may want to reach out to them.`;
        if (location) {
          message += `\n\nLast known location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        }
        break;
      default:
        subject = `Sentri Alert from ${userName}`;
        message = `${userName} has triggered an alert on Sentri.`;
    }

    // Log alerts to database
    const alertRecords = contacts.map(contact => ({
      safety_event_id,
      trusted_contact_id: contact.id,
      user_id,
      alert_type,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }));

    const { error: alertError } = await supabase
      .from('contact_alerts')
      .insert(alertRecords);

    if (alertError) {
      console.error('Error logging alerts:', alertError);
    }

    // In a production app, you would integrate with:
    // - Twilio for SMS
    // - SendGrid/Resend for email
    // - Firebase Cloud Messaging for push notifications
    
    // For now, we log the alerts that would be sent
    console.log(`Alert sent to ${contacts.length} contacts:`);
    contacts.forEach(contact => {
      console.log(`- ${contact.name}: ${contact.email || contact.phone}`);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alerts sent to ${contacts.length} contacts`,
        contacts_alerted: contacts.length,
        alert_details: {
          subject,
          message,
          type: alert_type,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
