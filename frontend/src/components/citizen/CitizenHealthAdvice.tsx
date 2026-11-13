import React from 'react';
import { getCitizenHealthGuidance } from '../../utils/citizenZones';
import { ExerciseScene, CommuteScene, HomeScene, FamilyScene } from './CitizenScenes';
import { Shield, Heart, Home, AlertCircle, CheckCircle2, Sparkles, Lightbulb } from 'lucide-react';

interface Props {
  currentPm25: number;
  stationName: string;
}

export const CitizenHealthAdvice: React.FC<Props> = ({
  currentPm25,
  stationName,
}) => {
  const guidance = getCitizenHealthGuidance(currentPm25);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Safe':
      case 'Open Windows':
      case 'Normal':
      case 'Not Needed':
        return (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {status}
          </span>
        );
      case 'Caution':
      case 'Recommended':
      case 'Limit Ventilation':
      case 'Take Precaution':
        return (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {status}
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
            {status}
          </span>
        );
    }
  };

  // Specific actionable recommendations based on PM2.5 tier
  const actionableTips = {
    exercise:
      currentPm25 <= 60
        ? 'Great day for outdoor running or park games.'
        : currentPm25 <= 120
        ? 'Shift heavy cardio indoors to a gym; keep outdoor walks light.'
        : 'Do indoor yoga, stretching or gym training rather than outdoor runs.',
    commute:
      currentPm25 <= 60
        ? 'Normal travel; no mask needed for most commuters.'
        : currentPm25 <= 120
        ? 'Keep an N95 mask handy for traffic jams and bike commutes.'
        : 'Slip on a fitted N95 mask before stepping onto roads or metro platforms.',
    home:
      currentPm25 <= 60
        ? 'Open windows during morning hours to air out the house.'
        : currentPm25 <= 120
        ? 'Air out rooms around 2 PM; close windows by evening rush.'
        : 'Keep doors and windows sealed; run HEPA air purifiers in bedrooms.',
    family:
      currentPm25 <= 60
        ? 'Normal routines for children and grandparents.'
        : currentPm25 <= 120
        ? 'Keep asthma inhalers accessible; monitor kids during sports.'
        : 'Keep vulnerable family members in filtered rooms; avoid evening outings.',
  };

  return (
    <div className="bg-[#121620] border-2 border-[#232A3B] rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Practical Health & Daily Protection
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Clear, actionable recommendations for everyday activities in {stationName}
          </p>
        </div>

        <span className="text-xs text-slate-400 self-start sm:self-center font-mono">
          CPCB Health Guidelines
        </span>
      </div>

      {/* 4 Health Action Cards with Visual Daily Scenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Outdoor / Indoor Exercise */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-[#232A3B] flex flex-col justify-between hover:border-slate-600 transition-all overflow-hidden group">
          <div>
            {/* Visual Scene Illustration */}
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#232A3B] bg-[#0B1019] group-hover:border-slate-600 transition-colors">
              <ExerciseScene height={125} />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{guidance.outdoorExercise.icon}</span>
              {getStatusBadge(guidance.outdoorExercise.status)}
            </div>

            <h3 className="text-sm font-bold text-white mb-0.5">
              Exercise & Workout
            </h3>
            <span className="text-xs font-semibold text-slate-200 block mb-1.5">
              {guidance.outdoorExercise.title}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {guidance.outdoorExercise.description}
            </p>
          </div>

          {/* Actionable Today's Tip */}
          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-start gap-2 bg-[#121824]/60 p-2.5 rounded-xl">
            <Lightbulb className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              <strong className="text-[#ECC138]">Action:</strong> {actionableTips.exercise}
            </p>
          </div>
        </div>

        {/* Card 2: Masks & Commutes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-[#232A3B] flex flex-col justify-between hover:border-slate-600 transition-all overflow-hidden group">
          <div>
            {/* Visual Scene Illustration */}
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#232A3B] bg-[#0B1019] group-hover:border-slate-600 transition-colors">
              <CommuteScene height={125} />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{guidance.masksProtection.icon}</span>
              {getStatusBadge(guidance.masksProtection.status)}
            </div>

            <h3 className="text-sm font-bold text-white mb-0.5">
              Daily Commute & Travel
            </h3>
            <span className="text-xs font-semibold text-slate-200 block mb-1.5">
              {guidance.masksProtection.title}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {guidance.masksProtection.description}
            </p>
          </div>

          {/* Actionable Today's Tip */}
          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-start gap-2 bg-[#121824]/60 p-2.5 rounded-xl">
            <Lightbulb className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              <strong className="text-[#ECC138]">Action:</strong> {actionableTips.commute}
            </p>
          </div>
        </div>

        {/* Card 3: Home & Indoor Air */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-[#232A3B] flex flex-col justify-between hover:border-slate-600 transition-all overflow-hidden group">
          <div>
            {/* Visual Scene Illustration */}
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#232A3B] bg-[#0B1019] group-hover:border-slate-600 transition-colors">
              <HomeScene height={125} />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{guidance.homeVentilation.icon}</span>
              {getStatusBadge(guidance.homeVentilation.status)}
            </div>

            <h3 className="text-sm font-bold text-white mb-0.5">
              Home & Windows
            </h3>
            <span className="text-xs font-semibold text-slate-200 block mb-1.5">
              {guidance.homeVentilation.title}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {guidance.homeVentilation.description}
            </p>
          </div>

          {/* Actionable Today's Tip */}
          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-start gap-2 bg-[#121824]/60 p-2.5 rounded-xl">
            <Lightbulb className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              <strong className="text-[#ECC138]">Action:</strong> {actionableTips.home}
            </p>
          </div>
        </div>

        {/* Card 4: Children & Sensitive Groups */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D111A] border border-[#232A3B] flex flex-col justify-between hover:border-slate-600 transition-all overflow-hidden group">
          <div>
            {/* Visual Scene Illustration */}
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#232A3B] bg-[#0B1019] group-hover:border-slate-600 transition-colors">
              <FamilyScene height={125} />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{guidance.sensitiveGroups.icon}</span>
              {getStatusBadge(guidance.sensitiveGroups.status)}
            </div>

            <h3 className="text-sm font-bold text-white mb-0.5">
              Sensitive Family Members
            </h3>
            <span className="text-xs font-semibold text-slate-200 block mb-1.5">
              {guidance.sensitiveGroups.title}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {guidance.sensitiveGroups.description}
            </p>
          </div>

          {/* Actionable Today's Tip */}
          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-start gap-2 bg-[#121824]/60 p-2.5 rounded-xl">
            <Lightbulb className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              <strong className="text-[#ECC138]">Action:</strong> {actionableTips.family}
            </p>
          </div>
        </div>
      </div>

      {/* Advisory Strip */}
      <div className="mt-6 pt-3.5 border-t border-[#232A3B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            If experiencing breathing discomfort or chest tightness, reduce physical exertion and consult a physician.
          </span>
        </div>
        <span className="font-mono text-slate-400 whitespace-nowrap">
          National Emergency Helpline: 112
        </span>
      </div>
    </div>
  );
};
