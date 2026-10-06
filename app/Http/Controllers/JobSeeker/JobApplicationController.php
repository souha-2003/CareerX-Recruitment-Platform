<?php

namespace App\Http\Controllers\JobSeeker;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class JobApplicationController extends Controller
{
    public function index(Request $request)
    {
        $profile = Auth::user()->profile;

        $applications = $profile ? $profile->applications()
            ->with(['jobPost.company', 'jobPost.city', 'jobPost.category', 'resume'])
            ->latest()
            ->get() : collect();

        $stats = [
            'total' => $applications->count(),
            'applied' => $applications->where('status', 'applied')->count(),
            'reviewed' => $applications->where('status', 'reviewed')->count(),
            'interview' => $applications->where('status', 'interview')->count(),
            'accepted' => $applications->where('status', 'accepted')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
        ];

        return Inertia::render('Seeker/Applications', [
            'applications' => $applications,
            'stats' => $stats,
            'selectedAppId' => $request->get('app_id'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('jobs.apply');

        $validated = $request->validate([
            'job_post_id'  => 'required|exists:job_posts,id',
            'resume_id'    => 'nullable|exists:resumes,id',
            'cover_letter' => 'nullable|string',
        ]);

        $profile = Auth::user()->profile;

        if (!$profile) {
            return redirect()->back()->with('error', __('You must complete your profile data before applying for jobs.'));
        }

        $alreadyApplied = JobApplication::where('job_post_id', $validated['job_post_id'])
            ->where('profile_id', $profile->id)
            ->exists();

        if ($alreadyApplied) {
            return redirect()->back()->with('error', __('You have already applied for this job.'));
        }

        $application = JobApplication::create([
            'job_post_id'  => $validated['job_post_id'],
            'profile_id'   => $profile->id,
            'resume_id'    => $validated['resume_id'] ?? null,
            'cover_letter' => $validated['cover_letter'] ?? null,
            'status'       => 'applied',
        ]);

        $application->loadMissing(['jobPost.company.users', 'jobPost.creator', 'profile.user']);
        $employers = collect();
        if ($application->jobPost?->creator) {
            $employers->push($application->jobPost->creator);
        }
        if ($application->jobPost?->company?->users) {
            $employers = $employers->merge($application->jobPost->company->users);
        }
        foreach ($employers->unique('id') as $employer) {
            $employer->notify(new \App\Notifications\NewJobApplicationNotification($application));
        }

        return redirect()->back()->with('success', __('You have successfully applied for this job.'));
    }

    public function show(JobApplication $application)
    {
        if ($application->profile_id !== Auth::user()->profile?->id) {
            abort(403, __('You are not authorized to view this application.'));
        }

        return redirect()->route('job-seeker.applications.index', ['app_id' => $application->id]);
    }
}

