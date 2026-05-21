import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground mt-2">
          Gérez les préférences de votre compte et les intégrations.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Profil Utilisateur</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" defaultValue="Admin User" className="max-w-md" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@instaanalyzer.com" className="max-w-md" />
            </div>
            <Button className="mt-2">Sauvegarder</Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Intégration n8n</CardTitle>
            <CardDescription>
              Configurez le webhook de votre workflow n8n.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="webhookUrl">URL du Webhook</Label>
              <Input 
                id="webhookUrl" 
                defaultValue="http://localhost:5678/webhook/eda5c7d6-fc4b-4997-b5de-b4f7cb60ee78" 
                className="max-w-xl font-mono text-sm" 
              />
            </div>
            <Button className="mt-2">Mettre à jour le Webhook</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
