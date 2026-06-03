import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and integrations.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Admin User" className="max-w-md" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@instaanalyzer.com" className="max-w-md" />
            </div>
            <Button className="mt-2">Save</Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>n8n Integration</CardTitle>
            <CardDescription>
              Configure your n8n workflow webhook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input 
                id="webhookUrl" 
                defaultValue="http://localhost:5678/webhook/eda5c7d6-fc4b-4997-b5de-b4f7cb60ee78" 
                className="max-w-xl font-mono text-sm" 
              />
            </div>
            <Button className="mt-2">Update Webhook</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
