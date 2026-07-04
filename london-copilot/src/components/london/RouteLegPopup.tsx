"use client";

import type { RouteStep } from "@contract/query.types";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bike, Bus, Footprints, TrainFront, X } from "lucide-react";
import { glassPanel } from "@/components/london/glassStyles";
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

interface RouteLegPopupProps {
	step: RouteStep;
	legIndex: number;
	totalLegs: number;
	onClose: () => void;
}

export default function RouteLegPopup({
	step,
	legIndex,
	totalLegs,
	onClose,
}: RouteLegPopupProps) {
	const meta = parseRouteStepMeta(step);
	const Icon = MODE_ICONS[step.mode];
	const departureTime = formatLegTime(step.departureTime);
	const arrivalTime = formatLegTime(step.arrivalTime);
	const showTiming = departureTime || arrivalTime;

	return (
		<div
			className={cn(
				"pointer-events-auto w-[min(320px,calc(100vw-2.5rem))] overflow-hidden",
				glassPanel,
			)}
			style={{ borderLeft: `3px solid ${meta.lineColor}` }}
		>
			<div className="p-3.5">
				<div className="flex items-start gap-2.5">
					<span
						className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 shadow-inner"
						style={{
							backgroundColor: `${meta.lineColor}33`,
							color: meta.lineColor,
						}}
					>
						<Icon className="size-4" strokeWidth={2.2} />
					</span>
					<div className="min-w-0 flex-1">
						<p className="font-medium text-[10px] text-white/40 uppercase tracking-wider">
							Leg {legIndex + 1} of {totalLegs}
						</p>
						<p className="mt-0.5 font-semibold text-sm text-white/95 leading-snug">
							{meta.title}
						</p>
						{meta.subtitle ? (
							<p className="mt-1 text-white/55 text-xs">{meta.subtitle}</p>
						) : null}
					</div>
					<button
						aria-label="Close leg details"
						className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
						onClick={onClose}
						type="button"
					>
						<X className="size-4" />
					</button>
				</div>

				{(step.from || step.to) && (
					<div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5">
						<div className="flex items-center gap-2 text-xs">
							<div className="min-w-0 flex-1">
								<p className="text-[10px] text-white/35 uppercase tracking-wide">
									From
								</p>
								<p className="mt-0.5 font-medium text-white/85">
									{step.from ?? "Start"}
								</p>
							</div>
							<ArrowRight className="size-3.5 shrink-0 text-white/30" />
							<div className="min-w-0 flex-1 text-right">
								<p className="text-[10px] text-white/35 uppercase tracking-wide">
									To
								</p>
								<p className="mt-0.5 font-medium text-white/85">
									{step.to ?? "End"}
								</p>
							</div>
						</div>
					</div>
				)}

				{showTiming ? (
					<div className="mt-2.5 grid grid-cols-2 gap-2">
						<div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2">
							<p className="text-[10px] text-white/35 uppercase tracking-wide">
								Board
							</p>
							<p className="mt-0.5 font-semibold text-sm text-white/90 tabular-nums">
								{departureTime ?? "Now"}
							</p>
						</div>
						<div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-right">
							<p className="text-[10px] text-white/35 uppercase tracking-wide">
								Alight
							</p>
							<p className="mt-0.5 font-semibold text-sm text-white/90 tabular-nums">
								{arrivalTime ?? `${step.durationMinutes}m`}
							</p>
						</div>
					</div>
				) : null}

				{meta.lineName && step.mode !== "walk" ? (
					<div
						className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-[11px]"
						style={{
							backgroundColor: `${meta.lineColor}22`,
							color: meta.lineColor,
							border: `1px solid ${meta.lineColor}44`,
						}}
					>
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: meta.lineColor }}
						/>
						{meta.lineName}
					</div>
				) : null}

				{step.departurePlatform && step.mode !== "walk" ? (
					<p className="mt-2 text-white/60 text-xs">
						Platform:{" "}
						<span className="text-white/80">{step.departurePlatform}</span>
					</p>
				) : null}

				{step.interchangeHint ? (
					<p className="mt-1 text-white/60 text-xs">
						Interchange:{" "}
						<span className="text-white/80">{step.interchangeHint}</span>
					</p>
				) : null}

				{meta.direction && step.mode !== "walk" ? (
					<p className="mt-2 text-white/60 text-xs">
						Direction: <span className="text-white/80">{meta.direction}</span>
					</p>
				) : null}

				{meta.stopCount != null && step.mode !== "walk" ? (
					<p className="mt-1 text-white/50 text-xs">
						{meta.stopCount} intermediate stop{meta.stopCount === 1 ? "" : "s"}{" "}
						before you alight
					</p>
				) : null}

				<p className="mt-3 text-white/55 text-xs leading-relaxed">
					{step.detailedInstruction ?? step.instruction}
				</p>
			</div>
		</div>
	);
}
