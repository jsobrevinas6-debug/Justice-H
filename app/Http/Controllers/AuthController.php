<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate an existing user.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($validated, (bool) $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        $redirect = match ($user->role) {
            'admin' => route('admin.dashboard', absolute: false),
            'municipality' => route('municipality.dashboard', [
                'municipality' => $user->municipality ?? 'Santa Rosa City',
                'name' => $user->name,
                'role' => $user->designation ?? 'City Legal Officer',
            ], absolute: false),
            default => route('home', absolute: false),
        };

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => $user,
            'redirect' => $redirect,
        ]);
    }

    /**
     * Register a new user (Citizen or Municipality Official).
     */
    public function signup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', 'string', 'in:user,citizen,municipality'],
            'municipality' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $role = in_array($validated['role'] ?? 'user', ['municipality'], true) ? 'municipality' : 'user';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'municipality' => $validated['municipality'] ?? ($role === 'municipality' ? 'Santa Rosa City' : null),
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        $redirect = match ($user->role) {
            'municipality' => route('municipality.dashboard', [
                'municipality' => $user->municipality,
                'name' => $user->name,
                'role' => $user->designation ?? 'Legal Desk Officer',
            ], absolute: false),
            default => route('home', absolute: false),
        };

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully.',
            'user' => $user,
            'redirect' => $redirect,
        ]);
    }

    /**
     * Terminate the authenticated session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
            'redirect' => route('home', absolute: false),
        ]);
    }

    /**
     * Return current authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => Auth::user(),
        ]);
    }
}
