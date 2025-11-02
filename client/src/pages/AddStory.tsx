import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import PageGradientBackground from "@/components/PageGradientBackground";

export default function AddStory() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event: "",
    introduction: "",
    true_version: "",
    fake_version: "",
    explanation: "",
    hint: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Add story mutation
  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/folders/${folderId}/stories`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Story added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      navigate(`/folders/${folderId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add story",
        variant: "destructive"
      });
      console.error("Error adding story:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Enforce 500 char limit for hint
    if (name === "hint" && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const validatedData = insertStorySchema.parse({
        ...formData,
        folder_id: folderId
      });
      
      // Submit data
      await addStoryMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const formattedErrors: { [key: string]: string } = {};
        error.errors.forEach(err => {
          const fieldName = err.path[0] as string;
          formattedErrors[fieldName] = err.message;
        });
        setErrors(formattedErrors);
        
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive"
        });
      } else {
        console.error("Error submitting form:", error);
      }
      setIsSubmitting(false);
    }
  };
  
  // Navigate back to folder
  const handleBack = () => {
    navigate(`/folders/${folderId}`);
  };
  
  // Validate form before submit
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (formData.event.trim() === "") newErrors.event = "Event is required";
    if (formData.introduction.trim() === "") newErrors.introduction = "Introduction is required";
    if (formData.true_version.trim() === "") newErrors.true_version = "True version is required";
    if (formData.fake_version.trim() === "") newErrors.fake_version = "Fake version is required";
    if (formData.explanation.trim() === "") newErrors.explanation = "Explanation is required";
    if (formData.hint && formData.hint.length > 500) newErrors.hint = "Hint must be 500 characters or less";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  if (isNaN(folderId)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Invalid folder ID</h2>
        <Button onClick={() => navigate("/folders")}>Back to Folders</Button>
      </div>
    );
  }
  
  return (
    <PageGradientBackground>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Add New Story</h1>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Folder
          </Button>
        </div>

        <Card className="bg-[#1a3c42] shadow rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="event" className="block text-sm font-medium text-[#00ffe0]">
                    Event Title
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="event"
                      name="event"
                      value={formData.event}
                      onChange={handleChange}
                      placeholder="Enter the event title"
                      className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
                    />
                  </div>
                  {errors.event ? (
                    <p className="mt-1 text-xs text-error">{errors.event}</p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">Maximum 100 characters</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="introduction" className="block text-sm font-medium text-[#00ffe0]">
                    Introduction
                  </Label>
                  <div className="mt-1">
                    <Textarea
                      id="introduction"
                      name="introduction"
                      value={formData.introduction}
                      onChange={handleChange}
                      placeholder="Provide context for the historical event"
                      className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
                    />
                  </div>
                  {errors.introduction ? (
                    <p className="mt-1 text-xs text-error">{errors.introduction}</p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">Maximum 300 characters</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="true_version" className="block text-sm font-medium text-[#00ffe0]">
                    True Version
                  </Label>
                  <div className="mt-1 flex gap-3">
                    <Textarea
                      id="true_version"
                      name="true_version"
                      value={formData.true_version}
                      onChange={handleChange}
                      placeholder="The historically accurate account"
                      className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] flex-1"
                    />
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          if (!formData.true_version.trim()) {
                            toast({ title: 'Error', description: 'Please enter a True Version first', variant: 'destructive' });
                            return;
                          }

                          try {
                            setIsSubmitting(true);
                            const res = await apiRequest('POST', '/api/ollama/generate', { true_version: formData.true_version });
                            const json = await res.json();
                            if (json?.hallucinated) {
                              setFormData(prev => ({ ...prev, fake_version: json.hallucinated }));
                              toast({ title: 'Generated', description: 'Fake version generated and filled.', });
                            } else {
                              toast({ title: 'No result', description: 'No hallucinated content returned', variant: 'destructive' });
                            }
                          } catch (err) {
                            console.error('Failed to generate hallucinated version', err);
                            toast({ title: 'Error', description: 'Failed to generate fake version', variant: 'destructive' });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Generating...' : 'Generate hallucination'}
                      </Button>
                    </div>
                  </div>
                  {errors.true_version ? (
                    <p className="mt-1 text-xs text-error">{errors.true_version}</p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">Maximum 3000 characters</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="fake_version" className="block text-sm font-medium text-[#00ffe0]">
                    Fake Version
                  </Label>
                  <div className="mt-1">
                    <Textarea
                      id="fake_version"
                      name="fake_version"
                      value={formData.fake_version}
                      onChange={handleChange}
                      placeholder="The fabricated or altered account"
                      className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
                    />
                  </div>
                  {errors.fake_version ? (
                    <p className="mt-1 text-xs text-error">{errors.fake_version}</p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">Maximum 3000 characters</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="explanation" className="block text-sm font-medium text-[#00ffe0]">
                    Explanation (optional)
                  </Label>
                  <div className="mt-1">
                    <Textarea
                      id="explanation"
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleChange}
                      placeholder="Explain why the fake version is plausible or interesting (optional)"
                      className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hint" className="block text-sm font-medium text-[#00ffe0]">
                    Hint (optional, max 500 characters)
                  </Label>
                  <div className="mt-1">
                    <Textarea
                      id="hint"
                      name="hint"
                      value={formData.hint}
                      onChange={handleChange}
                      maxLength={500}
                      placeholder="A short clue or explanation (optional)"
                      className={`bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0] ${errors.hint ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.hint && <div className="text-red-500 text-sm">{errors.hint}</div>}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="mr-3"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Story"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageGradientBackground>
  );
}
