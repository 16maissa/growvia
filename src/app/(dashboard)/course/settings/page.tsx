"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Plus, BookOpen } from "lucide-react";

export default function CourseSettingsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/course/list");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/course/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        setName("");
        setDescription("");
        fetchCourses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Course Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your courses and basic information.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Course</CardTitle>
            <CardDescription>Setup a new environment for your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Masterclass Instagram 2026" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this course about?" className="min-h-[100px]" />
              </div>
              <Button type="submit" disabled={creating || !name} className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
            <CardDescription>List of all your configured courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#0F6E56]" /></div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <BookOpen className="mx-auto h-8 w-8 mb-3 opacity-50" />
                <p>No courses found. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold">{course.name}</h4>
                    {course.description && <p className="text-sm text-muted-foreground mt-1">{course.description}</p>}
                    <div className="mt-3 text-xs text-muted-foreground flex gap-3">
                      <span>ID: {course.id.slice(-6)}</span>
                      <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                      {course.telegram_bot_active && (
                        <span className="text-emerald-600 font-medium bg-emerald-500/10 px-2 rounded-full">Bot Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
