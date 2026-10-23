<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'case_number',
    'user_id',
    'citizen_name',
    'phone',
    'municipality',
    'barangay',
    'category',
    'urgency',
    'title',
    'description',
    'status',
    'assigned_to',
    'coordinates',
    'resolution_notes',
])]
class Incident extends Model
{
    use HasFactory;

    /**
     * User who filed or is associated with this incident.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
