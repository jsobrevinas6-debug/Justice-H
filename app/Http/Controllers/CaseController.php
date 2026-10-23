<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CaseController extends Controller
{
    /**
     * List incidents with optional filtering by municipality or status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Incident::query()->with('user:id,name,email');

        if ($municipality = $request->query('municipality')) {
            $query->where('municipality', $municipality);
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'like', "%{$search}%")
                    ->orWhere('citizen_name', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('barangay', 'like', "%{$search}%");
            });
        }

        $cases = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count' => $cases->count(),
            'cases' => $cases,
        ]);
    }

    /**
     * Store a newly filed case in MySQL.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'citizen_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'municipality' => ['required', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'urgency' => ['nullable', 'string', 'in:routine,high,urgent'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'coordinates' => ['nullable', 'string', 'max:100'],
        ]);

        // Generate Laguna Municipality Code abbreviation
        $muniSlug = Str::upper(substr(preg_replace('/[^a-zA-Z]/', '', $validated['municipality']), 0, 3));
        $caseNumber = sprintf('LAG-%s-%s-%04d', $muniSlug, date('Y'), random_int(100, 9999));

        $incident = Incident::create([
            'case_number' => $caseNumber,
            'user_id' => Auth::id(),
            'citizen_name' => $validated['citizen_name'],
            'phone' => $validated['phone'],
            'municipality' => $validated['municipality'],
            'barangay' => $validated['barangay'] ?? 'Center',
            'category' => $validated['category'],
            'urgency' => $validated['urgency'] ?? 'routine',
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'pending',
            'coordinates' => $validated['coordinates'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your case has been filed successfully and registered in the municipality queue.',
            'case' => $incident,
        ], 201);
    }

    /**
     * Update incident status (e.g. assigned, under_review, resolved).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,under_review,assigned,resolved'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
            'resolution_notes' => ['nullable', 'string'],
        ]);

        $incident = Incident::findOrFail($id);
        $incident->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Case {$incident->case_number} status updated to {$incident->status}.",
            'case' => $incident,
        ]);
    }
}
