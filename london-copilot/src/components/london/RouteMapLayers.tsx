"use client";

import type { RouteStep, RoutingData } from "@contract/query.types";
import type { LucideIcon } from "lucide-react";
import { Bike, Bus, Footprints, TrainFront } from "lucide-react";
import { LED_CREAM } from "@/components/london/londonTheme";
import RouteLegPopup from "@/components/london/RouteLegPopup";
import {
	MapMarker,
	MapPopup,
	MapRoute,
	MarkerContent,
	MarkerLabel,
} from "@/components/ui/map";
import type { RouteSegment } from "@/lib/map/routeSegments";
import { cn } from "@/lib/utils";

interface RouteMapLayersProps {
	routing: RoutingData;
	segments: RouteSegment[];
	selectedIndex?: number | null;
	onSelectSegment?: (index: number | null) => void;
}

const MODE_ICONS: Record<RouteStep["mode"], LucideIcon> = {
	walk: Footprints,
	tube: TrainFront,
	bus: Bus,
	rail: TrainFront,
	cycle: Bike,
};

function ModeIcon({
	mode,
	selected,
	accent,
}: {
	mode: RouteStep["mode"];
	selected: boolean;
	accent: string;
}) {
	const Icon = MODE_ICONS[mode];

	return (
		<button
			className={cn(
				"flex cursor-pointer items-center justify-center rounded-full border-2 border-white/90 shadow-lg transition-transform hover:scale-110",
				selected ? "size-9 scale-110" : "size-8",
			)}
			style={{
				backgroundColor: accent,
				boxShadow: selected ? `0 0 16px ${accent}88` : `0 0 10px ${accent}55`,
			}}
			type="button"
		>
			<Icon
				className={selected ? "size-4 text-white" : "size-3.5 text-white"}
				strokeWidth={2.5}
			/>
		</button>
	);
}

export default function RouteMapLayers({
	routing,
	segments,
	selectedIndex = null,
	onSelectSegment,
}: RouteMapLayersProps) {
	const selectedSeg =
		selectedIndex != null && selectedIndex >= 0
			? segments.find((seg) => seg.stepIndex === selectedIndex)
			: null;

	const sorted = segments
		.map((seg) => ({ seg, stepIndex: seg.stepIndex }))
		.sort((a, b) => {
			if (a.stepIndex === selectedIndex) return 1;
			if (b.stepIndex === selectedIndex) return -1;
			return 0;
		});

	const originLabel = routing.origin.label ?? "Start";
	const destLabel = routing.destination.label ?? "End";

	const handleSelect = (index: number) => {
		onSelectSegment?.(selectedIndex === index ? null : index);
	};

	return (
		<>
			{sorted.map(({ seg }) => {
				const stepIndex = seg.stepIndex;
				const isSelected = stepIndex === selectedIndex;
				const dimmed = selectedIndex != null && !isSelected;
				const isWalk = seg.mode === "walk";

				return (
					<MapRoute
						animatedDash={isWalk && !!seg.dashArray}
						color={seg.color}
						coordinates={seg.coordinates}
						dashArray={seg.dashArray}
						id={`route-seg-${stepIndex}`}
						key={`route-seg-${stepIndex}`}
						onClick={() => handleSelect(stepIndex)}
						opacity={dimmed ? 0.35 : seg.opacity}
						width={isSelected ? seg.width + 2 : seg.width}
					/>
				);
			})}

			{segments.map((seg) => {
				const stepIndex = seg.stepIndex;
				const isSelected = stepIndex === selectedIndex;
				const dimmed = selectedIndex != null && !isSelected;

				return (
					<MapMarker
						anchor="bottom"
						key={`route-mode-${stepIndex}`}
						latitude={seg.iconPosition[1]}
						longitude={seg.iconPosition[0]}
						onClick={(e) => {
							e.stopPropagation();
							handleSelect(stepIndex);
						}}
					>
						<MarkerContent className="pointer-events-auto cursor-pointer">
							<div className={cn("transition-opacity", dimmed && "opacity-45")}>
								<ModeIcon
									accent={seg.meta.lineColor}
									mode={seg.mode}
									selected={isSelected}
								/>
								<MarkerLabel position="top">{seg.meta.shortLabel}</MarkerLabel>
							</div>
						</MarkerContent>
					</MapMarker>
				);
			})}

			{selectedSeg ? (
				<MapPopup
					className="!border-0 !bg-transparent !p-0 !shadow-none"
					closeButton={false}
					closeOnClick={false}
					latitude={selectedSeg.iconPosition[1]}
					longitude={selectedSeg.iconPosition[0]}
					offset={[0, -36]}
					onClose={() => onSelectSegment?.(null)}
				>
					<RouteLegPopup
						legIndex={selectedSeg.stepIndex}
						onClose={() => onSelectSegment?.(null)}
						step={selectedSeg.step}
						totalLegs={routing.steps.length}
					/>
				</MapPopup>
			) : null}

			<MapMarker latitude={routing.origin.lat} longitude={routing.origin.lng}>
				<MarkerContent>
					<div className="size-4 rounded-full border-2 border-white bg-emerald-500 shadow-lg" />
					<MarkerLabel position="top">{originLabel}</MarkerLabel>
				</MarkerContent>
			</MapMarker>

			<MapMarker
				latitude={routing.destination.lat}
				longitude={routing.destination.lng}
			>
				<MarkerContent>
					<div
						className="size-4 rounded-full border-2 border-white shadow-lg"
						style={{ backgroundColor: LED_CREAM }}
					/>
					<MarkerLabel position="bottom">{destLabel}</MarkerLabel>
				</MarkerContent>
			</MapMarker>
		</>
	);
}
