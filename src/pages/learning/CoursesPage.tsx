/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Course } from '../../types';
import { SAMPLE_COURSES } from '../../services/api/mockData';
import { ThreeAvatar } from '../../components/avatar/ThreeAvatar';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Volume2,
  HelpCircle,
} from 'lucide-react';

interface CoursesPageProps {
  selectedCourseId?: string | null;
  onSelectCourse?: (courseId: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  selectedCourseId: propSelectedId,
}) => {
  const [courses] = useState<Course[]>(SAMPLE_COURSES);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(propSelectedId || null);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  const { speak } = useAccessibility();

  const activeCourse = courses.find((c) => c.id === activeCourseId);

  // Lesson Detail View
  if (activeCourse) {
    const currentModule = activeCourse.modules[activeModuleIndex] || activeCourse.modules[0];

    return (
      <div className="space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => setActiveCourseId(null)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] border-2 border-[#222222] text-xs font-bold text-[#222222] hover:bg-[#FFE0BD] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </button>

        {/* Course Header Banner */}
        <div
          className="p-6 rounded-3xl border-2 border-[#222222] shadow-stitch flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ backgroundColor: activeCourse.bannerColor }}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#222222] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#222222]/20">
              {activeCourse.category} Track
            </span>
            <h1 className="text-2xl font-extrabold text-[#222222]">{activeCourse.title}</h1>
            <p className="text-xs text-[#222222]/80 max-w-xl">{activeCourse.description}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/80 p-3 rounded-2xl border border-[#222222]/20 shrink-0">
            <span className="text-3xl">{activeCourse.icon}</span>
            <div>
              <div className="text-xs font-bold text-[#222222]">
                {activeCourse.completedLessons} of {activeCourse.totalLessons} Lessons Done
              </div>
              <div className="w-28 h-2 bg-[#F1F1F1] rounded-full overflow-hidden mt-1 border border-[#222222]/20">
                <div
                  className="h-full bg-[#F28C00] rounded-full"
                  style={{ width: `${activeCourse.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Lesson Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Active Lesson Content & Video/3D Player */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#F28C00] uppercase tracking-wider">
                    Module {activeModuleIndex + 1}
                  </div>
                  <h2 className="text-lg font-bold text-[#222222]">{currentModule.title}</h2>
                </div>
                <button
                  onClick={() => speak(`${currentModule.title}. In this inclusive lesson, we explore foundational vocabulary with synchronized sign language demonstrations.`)}
                  className="p-2 rounded-full bg-[#FFF0C9] border border-[#222222] hover:bg-[#FFE0BD] text-[#222222] transition"
                  title="Read lesson text"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* 3D Sign Language Demonstration for this module */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F28C00]" />
                  <span>3D Sign Kinematic Demonstration</span>
                </div>
                <ThreeAvatar activeSignToken="HELLO" autoPlay={true} />
              </div>

              {/* Accessible Lesson Text Body */}
              <div className="space-y-3 text-sm text-[#222222] leading-relaxed p-4 bg-[#F1F1F1]/50 rounded-xl border border-[#222222]/15">
                <p>
                  Welcome to <strong>{currentModule.title}</strong>! In this inclusive learning pathway, concepts are represented through three simultaneous channels: clear plain-text descriptions, audible speech narration, and certified Indian Sign Language (ISL) hand shapes.
                </p>
                <div className="p-3 bg-[#FFF0C9] rounded-lg border border-[#222222]/20 text-xs">
                  <strong>Key Takeaway:</strong> Pay close attention to hand orientation and gentle facial markers. Practicing in front of your mirror or webcam doubles retention.
                </div>
              </div>

              {/* Quick Checkpoint Question */}
              <div className="p-4 bg-[#FFFFFF] rounded-xl border-2 border-[#222222] space-y-2.5">
                <div className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#F28C00]" />
                  <span>Interactive Knowledge Checkpoint</span>
                </div>
                <p className="text-xs text-[#555555]">
                  Which hand should form the dominant moving gesture when signing in ISL?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setQuizAnswered(1)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      quizAnswered === 1
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                        : 'bg-[#F1F1F1] hover:bg-[#FFE0BD] border-[#222222]/20'
                    }`}
                  >
                    Your primary dominant hand (right or left consistently)
                  </button>
                  <button
                    onClick={() => setQuizAnswered(2)}
                    className="p-2.5 rounded-xl border text-left font-bold bg-[#F1F1F1] hover:bg-[#FFE0BD] border-[#222222]/20"
                  >
                    You must switch hands randomly mid-sentence
                  </button>
                </div>
                {quizAnswered === 1 && (
                  <p className="text-xs font-bold text-emerald-800">
                    Correct! Consistency in your dominant hand ensures fluent clarity for sign receivers.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Modules Syllabus List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]">
                Course Modules ({activeCourse.modules.length})
              </h3>
              <div className="space-y-2">
                {activeCourse.modules.map((mod, idx) => {
                  const isActive = idx === activeModuleIndex;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setActiveModuleIndex(idx);
                        setQuizAnswered(null);
                      }}
                      className={`w-full p-3 rounded-xl border-2 text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-[#FFF0C9] border-[#222222] shadow-xs font-bold'
                          : 'bg-[#FFFFFF] hover:bg-[#F1F1F1] border-[#222222]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#F1F1F1] border border-[#222222] text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-[#222222] line-clamp-1">
                            {mod.title}
                          </div>
                          <span className="text-[10px] text-[#666666]">
                            {mod.duration} • {mod.signCount} signs
                          </span>
                        </div>
                      </div>

                      {mod.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-[#F28C00] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course Catalog Grid View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
          Inclusive Learning Catalog
        </h1>
        <p className="text-xs text-[#666666] mt-0.5">
          Curated pathways combining certified sign language, AAC, STEM, and everyday communication
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-6 rounded-3xl border-2 border-[#222222] bg-[#FFFFFF] shadow-stitch flex flex-col justify-between group hover:scale-[1.01] transition-transform"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-4xl">{course.icon}</span>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full border border-[#222222] text-[#222222]"
                  style={{ backgroundColor: course.bannerColor }}
                >
                  {course.category}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-[#222222] mt-4 group-hover:text-[#F28C00] transition">
                {course.title}
              </h2>
              <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                {course.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#222222]/15 space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#222222]">
                  <span>Track Progress</span>
                  <span>{course.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#F1F1F1] rounded-full overflow-hidden border border-[#222222]/20">
                  <div
                    className="h-full bg-[#F28C00] rounded-full"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#888888]">
                  {course.completedLessons} of {course.totalLessons} lessons completed
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveCourseId(course.id)}
              className="mt-5 w-full py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Enter Course Classroom</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
