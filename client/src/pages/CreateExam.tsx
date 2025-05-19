import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { PlusCircleIcon, Trash2Icon, ArrowLeftIcon } from "lucide-react";

// Form schema for creating an exam
const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  questions: z.array(
    z.object({
      question: z.string().min(1, "Question is required"),
      type: z.enum(["multiple-choice", "text"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]),
      points: z.number().min(1),
    })
  ).min(1, "At least one question is required"),
  assignToStudents: z.boolean().optional(),
  selectedStudents: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isTeacher } = useAuth();
  const { toast } = useToast();
  
  // Fetch subjects
  interface Subject {
    id: number;
    name: string;
    icon?: string;
  }
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });
  
  // Define student interface
  interface Student {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  }
  
  // Fetch students if teacher
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/teacher/students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/teacher/students?teacherId=${user.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    },
    enabled: !!user?.id && isTeacher,
  });
  
  // Form setup
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      questions: [
        { 
          question: "", 
          type: "multiple-choice", 
          options: ["", "", "", ""], 
          correctAnswer: 0, 
          points: 10 
        }
      ],
      assignToStudents: false,
      selectedStudents: [],
      dueDate: "",
    },
  } as { defaultValues: ExamFormValues });
  
  // Setup fields array for questions
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });
  
  // Create exam mutation
  const createExam = useMutation({
    mutationFn: async (examData: any) => {
      try {
        const response = await apiRequest("POST", "/api/exams", examData);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create exam");
        }
        return response.json();
      } catch (error) {
        console.error("Error creating exam:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Sınav oluşturuldu",
        description: "Sınavınız başarıyla oluşturuldu.",
      });
      
      // If assign to students is enabled, assign the exam
      if (form.getValues().assignToStudents && form.getValues().selectedStudents?.length) {
        assignExam.mutate({
          examId: data.id,
          studentIds: form.getValues().selectedStudents,
          dueDate: form.getValues().dueDate,
        });
      } else {
        // Navigate back to teacher exams
        setLocation("/teacher-exams");
      }
    },
    onError: (error) => {
      console.error("Error creating exam:", error);
      toast({
        title: "Sınav oluşturulamadı",
        description: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    },
  });
  
  // Assign exam mutation
  const assignExam = useMutation({
    mutationFn: async (data: { examId: number; studentIds: string[]; dueDate?: string }) => {
      const response = await apiRequest("POST", "/api/exam-assignments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exam assigned",
        description: "The exam has been assigned to the selected students.",
      });
      setLocation("/teacher-dashboard?tab=exams");
    },
    onError: (error) => {
      toast({
        title: "Failed to assign exam",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ExamFormValues) => {
    if (!user) return;
    
    // Ekstra doğrulama kontrolü ve her soruya ID ekleyerek düzeltme
    const validatedQuestions = data.questions.map((q, index) => {
      const correctAnswer = q.type === "multiple-choice" 
        ? parseInt(q.correctAnswer as string) 
        : q.correctAnswer.toString();
      
      // Boş alan kontrolü
      if (!q.question.trim()) {
        toast({
          title: "Form hatası",
          description: `Soru ${index + 1} için soru metni girilmemiş.`,
          variant: "destructive"
        });
        throw new Error("Question text is required");
      }
      
      if (q.type === "multiple-choice" && (!q.options || q.options.some(opt => !opt.trim()))) {
        toast({
          title: "Form hatası",
          description: `Soru ${index + 1} için tüm seçenekleri doldurun.`,
          variant: "destructive"
        });
        throw new Error("All options must be filled for multiple choice");
      }
        
      return {
        id: index + 1, // Her soruya bir ID ekliyoruz - sunucu bunu bekliyor
        question: q.question.trim(),
        type: q.type,
        options: q.type === "multiple-choice" ? q.options : undefined,
        correctAnswer: correctAnswer,
        points: q.points,
      };
    });
    
    try {
      createExam.mutate({
        teacherId: user.id,
        subjectId: parseInt(data.subjectId),
        title: data.title,
        description: data.description,
        questions: validatedQuestions,
      });
    } catch (error) {
      console.error("Error preparing exam data:", error);
    }
  };
  
  // Add new question
  const addQuestion = () => {
    append({ 
      question: "", 
      type: "multiple-choice", 
      options: ["", "", "", ""], 
      correctAnswer: 0, 
      points: 10 
    });
  };
  
  // Handle question type change
  const handleQuestionTypeChange = (index: number, value: "multiple-choice" | "text") => {
    const currentQuestions = form.getValues().questions;
    
    if (value === "multiple-choice") {
      form.setValue(`questions.${index}.options`, ["", "", "", ""]);
      form.setValue(`questions.${index}.correctAnswer`, 0);
    } else {
      form.setValue(`questions.${index}.options`, undefined);
      form.setValue(`questions.${index}.correctAnswer`, "");
    }
    
    form.setValue(`questions.${index}.type`, value);
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Please Log In</h2>
        <p className="text-neutral-medium mb-6">You need to log in to create exams.</p>
        <Button size="lg" onClick={() => setLocation("/login")}>Log In</Button>
      </div>
    );
  }
  
  if (!isTeacher) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-4">Teacher Access Only</h2>
        <p className="text-neutral-medium mb-6">Only teachers can create exams.</p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold mb-1">Create New Exam</h1>
          <p className="text-neutral-medium">Create an exam for your students</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/teacher-dashboard")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>Enter the basic information about this exam</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Exam Title</Label>
                    <Input
                      id="title"
                      placeholder="E.g., Midterm Exam, Chapter 5 Quiz"
                      {...form.register("title")}
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter exam description or instructions"
                      rows={3}
                      {...form.register("description")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      onValueChange={(value) => form.setValue("subjectId", value)}
                      defaultValue={form.getValues().subjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject: any) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subjectId && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.subjectId.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Questions</h2>
              
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-6">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${index}`}>Question</Label>
                        <Textarea
                          id={`question-${index}`}
                          placeholder="Enter your question here"
                          {...form.register(`questions.${index}.question`)}
                        />
                        {form.formState.errors.questions?.[index]?.question && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.questions[index]?.question?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Question Type</Label>
                        <RadioGroup
                          value={form.getValues().questions[index].type}
                          onValueChange={(value: "multiple-choice" | "text") => 
                            handleQuestionTypeChange(index, value)
                          }
                          className="flex space-x-4 mt-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="multiple-choice" id={`type-mc-${index}`} />
                            <Label htmlFor={`type-mc-${index}`}>Multiple Choice</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="text" id={`type-text-${index}`} />
                            <Label htmlFor={`type-text-${index}`}>Text Answer</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {form.getValues().questions[index].type === "multiple-choice" && (
                        <div>
                          <Label>Options</Label>
                          <div className="space-y-2 mt-1">
                            {form.getValues().questions[index].options?.map((_, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <div 
                                  className="flex items-center justify-center h-4 w-4 rounded-full border border-primary cursor-pointer"
                                  onClick={() => form.setValue(`questions.${index}.correctAnswer`, optionIndex.toString())}
                                >
                                  {parseInt(form.getValues().questions[index].correctAnswer as string) === optionIndex && (
                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                <Input
                                  placeholder={`Option ${optionIndex + 1}`}
                                  {...form.register(`questions.${index}.options.${optionIndex}`)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {form.getValues().questions[index].type === "text" && (
                        <div>
                          <Label htmlFor={`answer-${index}`}>Correct Answer</Label>
                          <Input
                            id={`answer-${index}`}
                            placeholder="Enter the correct answer"
                            {...form.register(`questions.${index}.correctAnswer` as string)}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Label htmlFor={`points-${index}`} className="mr-2">Points:</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          className="w-24"
                          min={1}
                          {...form.register(`questions.${index}.points`, { 
                            valueAsNumber: true,
                            min: 1 
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addQuestion}
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Assign to Students</CardTitle>
                <CardDescription>Optionally assign this exam to students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assign-students"
                      checked={form.getValues().assignToStudents}
                      onCheckedChange={(checked) => {
                        form.setValue("assignToStudents", checked);
                      }}
                    />
                    <Label htmlFor="assign-students">Assign to students after creating</Label>
                  </div>
                  
                  {form.getValues().assignToStudents && (
                    <>
                      <div>
                        <Label htmlFor="due-date">Due Date (Optional)</Label>
                        <Input
                          id="due-date"
                          type="datetime-local"
                          {...form.register("dueDate")}
                        />
                      </div>
                      
                      <div>
                        <Label>Select Students</Label>
                        <div className="mt-2 border rounded-md h-64 overflow-y-auto p-2">
                          {students.length > 0 ? (
                            students.map((student: any) => (
                              <div key={student.id} className="flex items-center space-x-2 py-2 border-b">
                                <input
                                  type="checkbox"
                                  id={`student-${student.id}`}
                                  value={student.id}
                                  onChange={(e) => {
                                    const selected = form.getValues().selectedStudents || [];
                                    if (e.target.checked) {
                                      form.setValue("selectedStudents", [...selected, student.id]);
                                    } else {
                                      form.setValue(
                                        "selectedStudents",
                                        selected.filter((id) => id !== student.id)
                                      );
                                    }
                                  }}
                                />
                                <Label htmlFor={`student-${student.id}`}>{student.name || student.email}</Label>
                              </div>
                            ))
                          ) : (
                            <div className="py-4 text-center text-neutral-medium">
                              No students available
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={createExam.isPending || assignExam.isPending}
              >
                {createExam.isPending || assignExam.isPending ? "Creating Exam..." : "Create Exam"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}