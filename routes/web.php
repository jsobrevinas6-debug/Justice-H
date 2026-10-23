<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaseController;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home', [
        'authUser' => Auth::user(),
    ]);
})->name('home');

Route::get('/municipality/dashboard', function () {
    $selectedMuni = request('municipality', 'Santa Rosa City');
    $user = Auth::user();

    $cases = Incident::where('municipality', $selectedMuni)
        ->orderBy('created_at', 'desc')
        ->get();

    return Inertia::render('MunicipalityDashboard', [
        'initialMunicipality' => $selectedMuni,
        'officialName' => $user?->name ?? request('name', 'Atty. Maria Santos'),
        'officialRole' => $user?->designation ?? request('role', 'City Legal Officer'),
        'initialCases' => $cases,
        'authUser' => $user,
    ]);
})->name('municipality.dashboard');

Route::get('/admin/dashboard', function () {
    $user = Auth::user();
    $allUsers = User::orderBy('created_at', 'desc')->get();
    $allCases = Incident::orderBy('created_at', 'desc')->get();

    return Inertia::render('AdminDashboard', [
        'adminName' => $user?->name ?? 'JusticePH Administrator',
        'adminEmail' => $user?->email ?? 'admin@justiceph.gov',
        'adminRole' => 'Provincial Super Administrator',
        'usersList' => $allUsers,
        'casesList' => $allCases,
        'authUser' => $user,
    ]);
})->name('admin.dashboard');

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/auth/signup', [AuthController::class, 'signup'])->name('auth.signup');
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
Route::get('/auth/user', [AuthController::class, 'user'])->name('auth.user');

// Case filing & management routes
Route::get('/api/cases', [CaseController::class, 'index'])->name('cases.index');
Route::post('/api/cases', [CaseController::class, 'store'])->name('cases.store');
Route::patch('/api/cases/{id}/status', [CaseController::class, 'updateStatus'])->name('cases.updateStatus');
