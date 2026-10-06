<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Job;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApplicantController extends Controller
{

    public function index(Request $request)
    {
        Gate::authorize('applications.view');

        $companyId = Auth::user()->company_id;

        $companyJobs = Job::where('company_id', $companyId)->select('id', 'title')->get();

        $cities = City::orderBy('name')->get(['id', 'name']);

        $query = JobApplication::whereHas('jobPost', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        })->with(['jobPost:id,title,job_type,work_type,salary_min,salary_max', 'profile.user:id,name,email,avatar', 'profile.city:id,name', 'profile.country:id,name', 'resume:id,title,file_path']);

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->whereHas('profile.user', function ($uq) use ($term) {
                $uq->where('name', 'like', $term);
            });
        }

        if ($request->filled('job_id')) {
            $query->where('job_post_id', $request->job_id);
        }

        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'pending' || $status === 'applied') {
                $query->whereIn('status', ['applied', 'pending']);
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('experience')) {
            $exp = (int) $request->experience;
            $query->whereHas('profile', function ($pq) use ($exp) {
                $pq->where('years_of_experience', '>=', $exp);
            });
        }

        if ($request->filled('city_id')) {
            $cityId = $request->city_id;
            $query->whereHas('profile', function ($pq) use ($cityId) {
                $pq->where('city_id', $cityId);
            });
        }

        $applications = $query->latest()->paginate(12)->withQueryString();

        $appliedCount = JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->whereIn('status', ['applied', 'pending'])->count();

        $counts = [
            'total'             => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->count(),
            'applied'           => $appliedCount,
            'reviewed'          => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->where('status', 'reviewed')->count(),
            'interview'         => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->whereIn('status', ['interview', 'accepted'])->count(),
            'interview_success' => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->where('status', 'interview_success')->count(),
            'interview_failed'  => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->where('status', 'interview_failed')->count(),
            'rejected'          => JobApplication::whereHas('jobPost', fn($q) => $q->where('company_id', $companyId))->where('status', 'rejected')->count(),
        ];

        return Inertia::render('Employer/Applicants', [
            'applications' => $applications,
            'companyJobs'  => $companyJobs,
            'cities'       => $cities,
            'counts'       => $counts,
            'filters'      => $request->only(['search', 'job_id', 'status', 'experience', 'city_id']),
        ]);
    }

    public function show(JobApplication $application)
    {
        Gate::authorize('applications.view');
        $this->authorizeCompanyApplication($application);

        if (in_array($application->status, ['applied', 'pending'])) {
            $application->update(['status' => 'reviewed']);
        }

        $application->load([
            'jobPost',
            'resume',
            'profile.user',
            'profile.country',
            'profile.city',
            'profile.experiences' => fn($q) => $q->orderBy('start_date', 'desc'),
            'profile.educations' => fn($q) => $q->orderBy('start_year', 'desc'),
            'profile.skills',
            'profile.languages',
            'profile.certifications',
            'profile.portfolioItems',
        ]);

        return Inertia::render('Employer/ApplicantDetail', [
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'cover_letter' => $application->cover_letter,
                'interview_date' => $application->interview_date ? $application->interview_date->format('Y-m-d H:i') : null,
                'meeting_link' => $application->meeting_link,
                'interview_notes' => $application->interview_notes,
                'created_at' => $application->created_at ? $application->created_at->format('M d, Y - h:i A') : '',
                'job' => [
                    'id' => $application->jobPost->id,
                    'title' => $application->jobPost->title,
                    'job_type' => $application->jobPost->job_type,
                    'work_type' => $application->jobPost->work_type,
                ],
                'candidate' => [
                    'id' => $application->profile->user->id,
                    'name' => $application->profile->user->name,
                    'email' => $application->profile->user->email,
                    'phone' => $application->profile->user->phone,
                    'avatar' => $application->profile->user->avatar ? asset('storage/' . $application->profile->user->avatar) : null,
                    'headline' => $application->profile->job_title,
                    'bio' => $application->profile->bio,
                    'years_of_experience' => $application->profile->years_of_experience,
                    'country' => $application->profile->country?->name,
                    'city' => $application->profile->city?->name,
                    'address' => $application->profile->address,
                    'work_type' => $application->profile->work_type,
                    'experiences' => $application->profile->experiences,
                    'educations' => $application->profile->educations,
                    'skills' => $application->profile->skills,
                    'languages' => $application->profile->languages,
                    'certifications' => $application->profile->certifications,
                    'portfolio' => $application->profile->portfolioItems,
                ],
                'resume' => $application->resume ? [
                    'id' => $application->resume->id,
                    'title' => $application->resume->title,
                    'download_url' => route('employer.applicants.resume', $application->id),
                ] : null,
            ],
        ]);
    }

    public function scheduleInterview(Request $request, JobApplication $application)
    {
        Gate::authorize('applications.manage');
        $this->authorizeCompanyApplication($application);

        $validated = $request->validate([
            'interview_date'  => ['required', 'date', 'after_or_equal:now'],
            'interview_notes' => ['nullable', 'string', 'max:2000'],
            'custom_link'     => ['nullable', 'string', 'max:500'],
        ]);

        $meetingLink = trim($validated['custom_link'] ?? '');
        if (!empty($meetingLink)) {

            if (!preg_match("~^(?:f|ht)tps?://~i", $meetingLink)) {
                if (str_contains($meetingLink, 'meet.google.com')) {
                    $meetingLink = 'https://' . $meetingLink;
                } elseif (preg_match('/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i', $meetingLink)) {
                    $meetingLink = 'https://meet.google.com/' . strtolower($meetingLink);
                } else {
                    $meetingLink = 'https://' . $meetingLink;
                }
            }
        } else {

            $meetingLink = 'https://meet.google.com/new';
        }

        $isReschedule = !empty($application->interview_date);

        $application->update([
            'interview_date'  => $validated['interview_date'],
            'meeting_link'    => $meetingLink,
            'interview_notes' => $validated['interview_notes'] ?? null,
            'status'          => 'interview',
        ]);

        $candidateUser = $application->profile?->user;
        if ($candidateUser) {
            $candidateUser->notify(new \App\Notifications\ApplicationStatusChangedNotification(
                $application,
                $isReschedule ? 'interview_rescheduled' : 'interview'
            ));
        }

        return redirect()->back()->with('success', $isReschedule ? __('Interview rescheduled successfully.') : __('Interview scheduled successfully.'));
    }

    public function updateStatus(Request $request, JobApplication $application)
    {
        Gate::authorize('applications.manage');
        $this->authorizeCompanyApplication($application);

        $validated = $request->validate([
            'status' => ['required', 'in:applied,pending,reviewed,accepted,rejected,interview,interview_success,interview_failed'],
        ]);

        $status = $validated['status'] === 'pending' ? 'applied' : $validated['status'];
        $oldStatus = $application->status;
        $application->update(['status' => $status]);

        $candidateUser = $application->profile?->user;

        if ($candidateUser && $application->wasChanged('status') && $status !== 'interview') {
            $candidateUser->notify(new \App\Notifications\ApplicationStatusChangedNotification($application, 'status'));
        }

        return redirect()->back()->with('success', __('Applicant status updated successfully.'));
    }

    public function downloadResume(JobApplication $application)
    {
        Gate::authorize('applications.view');
        $this->authorizeCompanyApplication($application);

        $resume = $application->resume;

        if (!$resume || !Storage::disk('public')->exists($resume->file_path)) {
            return redirect()->back()->with('error', __('Resume file not found or has been removed.'));
        }

        return Storage::disk('public')->download($resume->file_path, $resume->title . '.' . pathinfo($resume->file_path, PATHINFO_EXTENSION));
    }

    protected function authorizeCompanyApplication(JobApplication $application): void
    {
        $application->loadMissing('jobPost');

        if ($application->jobPost->company_id !== Auth::user()->company_id) {
            abort(403, __('You do not have permission to view this job application.'));
        }
    }
}

