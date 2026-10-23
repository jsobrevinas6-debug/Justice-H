import { useEffect, useRef } from 'react';

export default function Radar({
    color = '#9bf35b',
    mode = 'sweep',
    speed = 0.7,
    trail = 0.38,
    scale = 0.88,
    ringCount = 5,
    spokeCount = 8,
    targets = 5,
    clutter = 0.22,
    glow = 1.15,
    mouseInteraction = true,
    grain = 0.018,
    className = '',
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        let animationFrameId;
        let angle = 0;
        const mouse = { x: 0, y: 0, active: false };

        const targetPoints = Array.from({ length: targets }, (_, index) => {
            const seed = (index + 1) * 1.61803398875;
            const targetAngle = (seed * Math.PI * 2) % (Math.PI * 2);
            const radiusFactor = 0.32 + ((seed * 0.63) % 0.58);

            return {
                angle: targetAngle,
                radius: radiusFactor,
                size: 2.6 + (index % 3) * 0.9,
            };
        });

        const clutterPoints = Array.from(
            { length: Math.max(8, Math.round(clutter * 45)) },
            (_, index) => {
                const seed = (index + 1) * 2.41421356;

                return {
                    angle: (seed * 3.7) % (Math.PI * 2),
                    radius: 0.22 + ((seed * 0.49) % 0.74),
                    alpha: 0.12 + ((seed * 0.31) % 0.28),
                };
            }
        );

        const syncSize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const targetWidth = Math.max(1, Math.round(rect.width * dpr));
            const targetHeight = Math.max(1, Math.round(rect.height * dpr));

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
            }
        };

        const handlePointerMove = (event) => {
            if (!mouseInteraction) {
                return;
            }
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left - rect.width / 2;
            mouse.y = event.clientY - rect.top - rect.height / 2;
            mouse.active = true;
        };

        const handlePointerLeave = () => {
            mouse.active = false;
        };

        syncSize();
        const resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(canvas);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }
        window.addEventListener('resize', syncSize);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerleave', handlePointerLeave);

        const render = () => {
            syncSize();

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const dpr = window.devicePixelRatio || 1;

            if (width < 2 || height < 2) {
                animationFrameId = window.requestAnimationFrame(render);
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = (Math.min(width, height) / 2) * scale;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(centerX, centerY);

            // Concentric radar rings
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 1; i <= ringCount; i++) {
                ctx.globalAlpha = 0.14 + (i === ringCount ? 0.14 : 0);
                ctx.beginPath();
                ctx.arc(0, 0, (maxRadius / ringCount) * i, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Radial spokes
            ctx.globalAlpha = 0.1;
            for (let i = 0; i < spokeCount; i++) {
                const spokeAngle = (Math.PI * 2 * i) / spokeCount;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(spokeAngle) * maxRadius,
                    Math.sin(spokeAngle) * maxRadius
                );
                ctx.stroke();
            }

            // Clutter dots
            ctx.fillStyle = color;
            clutterPoints.forEach((point) => {
                ctx.globalAlpha = point.alpha;
                const px = Math.cos(point.angle) * maxRadius * point.radius;
                const py = Math.sin(point.angle) * maxRadius * point.radius;
                ctx.fillRect(px, py, 1.5, 1.5);
            });

            // Sweep beam
            const sweepSpan = Math.max(0.15, trail * Math.PI);
            if (mode === 'sweep') {
                const steps = 28;
                for (let i = 0; i < steps; i++) {
                    const ratio = i / steps;
                    const startAngle = angle - sweepSpan * (1 - ratio);
                    const endAngle = angle - sweepSpan * (1 - (i + 1) / steps);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, maxRadius, startAngle, endAngle);
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.globalAlpha = ratio * 0.16 * glow;
                    ctx.fill();
                }

                // Leading sweep line
                ctx.globalAlpha = Math.min(1, 0.78 * glow);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(angle) * maxRadius,
                    Math.sin(angle) * maxRadius
                );
                ctx.stroke();
            }

            // Targets illuminated by sweep
            targetPoints.forEach((target) => {
                let diff = (angle - target.angle) % (Math.PI * 2);
                if (diff < 0) {
                    diff += Math.PI * 2;
                }
                const pulse = Math.max(0, 1 - diff / (Math.PI * 1.65));
                const tx = Math.cos(target.angle) * maxRadius * target.radius;
                const ty = Math.sin(target.angle) * maxRadius * target.radius;

                ctx.fillStyle = color;
                ctx.globalAlpha = (0.28 + pulse * 0.72) * Math.min(1, glow);
                ctx.beginPath();
                ctx.arc(tx, ty, target.size, 0, Math.PI * 2);
                ctx.fill();

                if (pulse > 0.55) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = (pulse - 0.55) * 1.2;
                    ctx.beginPath();
                    ctx.arc(
                        tx,
                        ty,
                        target.size + (1 - pulse) * 18,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }
            });

            // Optional pointer ring
            if (mouse.active && mouseInteraction) {
                const dist = Math.hypot(mouse.x, mouse.y);
                if (dist <= maxRadius) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.45;
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Subtle grain hint
            if (grain > 0) {
                ctx.globalAlpha = Math.min(0.15, grain * 2);
                ctx.fillStyle = color;
                for (let i = 0; i < 12; i++) {
                    const gx = (Math.random() - 0.5) * maxRadius * 1.6;
                    const gy = (Math.random() - 0.5) * maxRadius * 1.6;
                    ctx.fillRect(gx, gy, 1, 1);
                }
            }

            ctx.restore();

            angle = (angle + 0.018 * speed) % (Math.PI * 2);
            animationFrameId = window.requestAnimationFrame(render);
        };

        animationFrameId = window.requestAnimationFrame(render);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', syncSize);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, [
        color,
        mode,
        speed,
        trail,
        scale,
        ringCount,
        spokeCount,
        targets,
        clutter,
        glow,
        mouseInteraction,
        grain,
    ]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
}
