"use client";

import type { RouteStep } from "@contract/query.types";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bike, Bus, Footprints, TrainFront } from "lucide-react";
import { glassCard, glassCardHover } from "@/components/london/glassStyles";
import { parseRouteStepMeta } from "@/lib/map/routeStepMeta";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<RouteStep["mode"], LucideIcon> = {
	walk: Footprints,
	tube: TrainFront,
	bus: Bus,
	rail: TrainFront,
	cycle: Bike,
};

function formatLegTime(iso?: string | null) {
	if (!iso) return null;

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;

	return date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

interface RouteLegStepCardProps {
	step: RouteStep;
	index: number;
	selected: boolean;
	onSelect: () => void;
}

export default function RouteLegStepCard({
	step,
	index,
	selected,
	onSelect,
}: RouteLegStepCardProps) {
	const meta = parseRouteStepMeta(step);
	const Icon = MODE_ICONS[step.mode];
	const departureTime = formatLegTime(step.departureTime);
	const arrivalTime = formatLegTime(step.arrivalTime);
	const timeLabel =
		departureTime && arrivalTime
			? `${departureTime}-${arrivalTime}`
			: departureTime
				? `Board ${departureTime}`
				: null;

	return (
		<button
			className={cn(
				"flex w-full gap-3 p-3 text-left transition-colors",
				glassCard,
				glassCardHover,
				selected && "ring-1 ring-white/20",
			)}
			onClick={onSelect}
			style={{ borderLeft: `3px solid ${meta.lineColor}` }}
			type="button"
		>
			<span
				className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10"
				style={{
					backgroundColor: `${meta.lineColor}22`,
					color: meta.lineColor,
				}}
			>
				<Icon className="size-4" strokeWidth={2.2} />
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<p className="font-medium text-sm text-white/88">{meta.title}</p>
					<span className="shrink-0 text-[11px] text-white/40 tabular-nums">
						{step.durationMinutes}m
					</span>
				</div>
				{meta.subtitle ? (
					<p className="mt-0.5 text-white/45 text-xs">{meta.subtitle}</p>
				) : null}
				{timeLabel || step.departurePlatform ? (
					<p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
						{timeLabel ? (
							<span className="tabular-nums">{timeLabel}</span>
						) : null}
						{step.departurePlatform && step.mode !== "walk" ? (
							<span>Platform {step.departurePlatform}</span>
						) : null}
					</p>
				) : null}
				{(step.from || step.to) && (
					<p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/50">
						<span className="truncate">{step.from ?? "Start"}</span>
						<ArrowRight className="size-3 shrink-0 opacity-40" />
						<span className="truncate">{step.to ?? "End"}</span>
					</p>
				)}
				<p className="mt-1 line-clamp-2 text-[11px] text-white/35 leading-relaxed">
					{step.detailedInstruction ?? step.instruction}
				</p>
			</div>
			<span
				className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-semibold text-[10px] text-white/50"
				style={{ backgroundColor: "rgba(253, 251, 212, 0.08)" }}
			>
				{index + 1}
			</span>
		</button>
	);
}
