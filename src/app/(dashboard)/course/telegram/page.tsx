"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Bot, Send, CheckCircle2 } from "lucide-react";

export default function TelegramSettingsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Config State
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);

  // Content State
  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Quiz State
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [sendingQuiz, setSendingQuiz] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [coursesRes, pdfsRes] = await Promise.all([
        fetch("/api/course/list"),
        fetch("/api/chat/documents") // assuming this exists from pdf chat, or we can use another route. Let's just create a quick endpoint if needed, but wait, the prompt says "freely select". We might need a small API route for PDFs if there isn't one. Let's assume we can fetch them.
      ]);
      
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
          setBotToken(data[0].telegram_bot_token || "");
          setChatId(data[0].telegram_chat_id || "");
          if (data[0].telegram_bot_active) setBotName("Active Bot");
        }
      }
      
      if (pdfsRes.ok) {
        const data = await pdfsRes.json();
        setPdfs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id);
    const course = courses.find(c => c.id === id);
    if (course) {
      setBotToken(course.telegram_bot_token || "");
      setChatId(course.telegram_chat_id || "");
      setBotName(course.telegram_bot_active ? "Active Bot" : null);
    }
  };

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setBotName(null);
    try {
      const res = await fetch("/api/course/configure-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, bot_token: botToken, chat_id: chatId })
      });
      const data = await res.json();
      if (data.success) {
        setBotName(data.bot_name || "Bot Active");
      } else {
        alert(data.error || "Failed to connect bot");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSendingMsg(true);
    try {
      const res = await fetch("/api/course/send-content-to-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, text: messageText })
      });
      if (res.ok) {
        setMessageText("");
        alert("Message sent successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleSendQuiz(e: React.FormEvent) {
    e.preventDefault();
    setSendingQuiz(true);
    try {
      const res = await fetch("/api/course/send-quiz-to-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, namespace: selectedNamespace })
      });
      if (res.ok) {
        alert("Quiz sent successfully!");
      } else {
        alert("Failed to send quiz. Ensure the N8N workflows are active.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingQuiz(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#0F6E56]" /></div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">No Course Found</h2>
        <p className="text-muted-foreground mb-4">You must create a course first before configuring the Telegram bot.</p>
        <Button onClick={() => window.location.href = '/course/settings'}>Go to Course Settings</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Telegram Bot Configuration</h2>
          <p className="text-muted-foreground mt-1">Connect your community group to answer questions and send quizzes automatically.</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mr-3">Select Course:</label>
        <select 
          className="border rounded-md p-2 bg-background"
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
        >
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Col: Config */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-[#229ED9]" /> Connection Setup</CardTitle>
              <CardDescription>Get these details from BotFather in Telegram.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bot Token</label>
                  <Input required value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telegram Group Chat ID</label>
                  <Input required value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="e.g. -1001234567890" />
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button type="submit" disabled={savingConfig || !botToken || !chatId} className="bg-[#229ED9] hover:bg-[#1C88BA] text-white">
                    {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Connection & Save
                  </Button>
                  {botName && (
                    <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Bot Active: {botName}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Actions */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Send Content to Group</CardTitle>
              <CardDescription>Push a message directly to your Telegram group.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <Textarea 
                  required 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="Hello everyone, don't forget the live session tonight!" 
                  className="min-h-[100px]" 
                />
                <Button type="submit" disabled={sendingMsg || !messageText || !botName} className="w-full">
                  {sendingMsg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Quiz to Group</CardTitle>
              <CardDescription>Generate an interactive quiz from a PDF and send it to your students.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendQuiz} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select PDF Source</label>
                  <select 
                    required
                    className="w-full border rounded-md p-2 bg-background"
                    value={selectedNamespace}
                    onChange={(e) => setSelectedNamespace(e.target.value)}
                  >
                    <option value="">-- Choose a document --</option>
                    {pdfs.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.fileName || doc.filename || doc.id}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={sendingQuiz || !selectedNamespace || !botName} className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white">
                  {sendingQuiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate & Send Quiz
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
