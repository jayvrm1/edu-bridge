/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Course } from '../../types';
import { BookOpen, Play, CheckCircle, Clock } from 'lucide-react';

interface CourseProgressSectionProps {
  courses: Course[];
  onContinueCourse: (courseId: string) => void;
  onViewAllCourses: () => void;
}

export const CourseProgressSection: React.FC<CourseProgressSectionProps> = ({
  courses,
  onContinueCourse,
  onViewAllCourses,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#222222]">
            Active Course Pathways
          </h2>
          <p className="text-xs text-[#666666]">
            Multi-modal learning tracks with synced sign gestures and audio
          </p>
        </div>
        <button
          onClick={onViewAllCourses}
          className="text-xs font-bold text-[#F28C00] hover:underline"
        >
          View All Courses →
        </button>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-5 rounded-2xl border-2 border-[#222222] bg-[#FFFFFF] shadow-stitch flex flex-col justify-between group hover:border-[#F28C00] transition"
          >
            <div>
              {/* Category tag & icon */}
              <div className="flex items-start justify-between">
                <span className="text-3xl">{course.icon}</span>
                <span
                  className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-[#222222] text-[#222222]"
                  style={{ backgroundColor: course.bannerColor }}
                >
                  {course.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-[#222222] mt-3 group-hover:text-[#F28C00] transition line-clamp-1">
                {course.title}
              </h3>
              <p className="text-xs text-[#666666] mt-1 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              {/* Meta details */}
              <div className="flex items-center gap-3 text-[11px] text-[#666666] font-medium mt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {course.durationMinutes} mins
                </span>
                <span>•</span>
                <span>{course.completedLessons}/{course.totalLessons} Lessons</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#222222]">
                  <span>Track Progress</span>
                  <span>{course.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F1F1] rounded-full overflow-hidden border border-[#222222]/20">
                  <div
                    className="h-full bg-[#F28C00] rounded-full transition-all duration-500"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-4 pt-3 border-t border-[#222222]/15">
              <button
                onClick={() => onContinueCourse(course.id)}
                className="w-full py-2 bg-[#F1F1F1] group-hover:bg-[#FFD966] text-[#222222] rounded-full text-xs font-bold border-2 border-[#222222] flex items-center justify-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5 fill-[#222222]" />
                <span>Continue Lesson</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
