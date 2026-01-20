import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, User, Phone, Mail, Crown } from 'lucide-react';

interface TrustedContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

const Contacts: React.FC = () => {
  const { user, loading } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });
  const [isPremium] = useState(false); // Will be fetched from profile

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data || []);
    }
    setIsLoading(false);
  };

  const addContact = async () => {
    if (!newContact.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your contact.",
        variant: "destructive",
      });
      return;
    }

    const maxContacts = isPremium ? 3 : 1;
    if (contacts.length >= maxContacts) {
      toast({
        title: isPremium ? "Maximum contacts reached" : "Upgrade to Premium",
        description: isPremium 
          ? "You can have up to 3 trusted contacts." 
          : "Free plan allows 1 contact. Upgrade for more.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('trusted_contacts')
      .insert({
        user_id: user!.id,
        name: newContact.name,
        phone: newContact.phone || null,
        email: newContact.email || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not add contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contact added",
        description: `${newContact.name} will be notified when you activate Safety Mode.`,
      });
      setNewContact({ name: '', phone: '', email: '' });
      setIsDialogOpen(false);
      fetchContacts();
    }
  };

  const deleteContact = async (id: string, name: string) => {
    const { error } = await supabase
      .from('trusted_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not remove contact.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contact removed",
        description: `${name} has been removed from your trusted contacts.`,
      });
      fetchContacts();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const maxContacts = isPremium ? 3 : 1;
  const canAddMore = contacts.length < maxContacts;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">Trusted Contacts</h1>
          <p className="text-muted-foreground mt-1">
            People who will be alerted when you activate Safety Mode
          </p>
        </header>

        {/* Contact Limit Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <span className="text-sm">
                {contacts.length} of {maxContacts} contact{maxContacts > 1 ? 's' : ''}
              </span>
            </div>
            {!isPremium && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Crown className="w-4 h-4" />
                <span>Premium: up to 3</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No contacts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add someone you trust to be notified in emergencies
                </p>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{contact.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {contact.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteContact(contact.id, contact.name)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Contact Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={!canAddMore}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Trusted Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Trusted Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <Button onClick={addContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Contacts;
