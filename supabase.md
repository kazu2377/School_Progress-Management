# Supabase仕様書 (training-management)

## プロジェクト
- Project ID: bblqqrfgusduurqdkgmg
- Name: training-management
- Region: ap-northeast-1

## 対象スコープ
- 今回のアプリで作成したカスタムオブジェクト（public スキーマ + Storage バケット + 関連ポリシー/トリガー/関数）
- Supabase 標準スキーマ（auth/storage/realtime/vault 等）は除外（標準オブジェクトは省略）

---

## public スキーマ

### テーブル一覧
- activity_logs
- application_attachments
- applications
- courses
- profiles
- roles
- students

### テーブル定義

#### activity_logs
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES |  |
| action | text | NO |  |
| details | jsonb | YES |  |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |

#### application_attachments
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| application_id | uuid | NO |  |
| file_path | text | NO |  |
| file_name | text | NO |  |
| category | text | NO |  |
| file_size | integer | NO |  |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |

#### applications
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| student_id | uuid | NO |  |
| company | text | NO |  |
| application_date | date | YES |  |
| position | text | YES |  |
| source | text | YES |  |
| status | text | YES | '応募中'::text |
| document_result | text | YES | '審査中'::text |
| resume_created | boolean | YES | false |
| work_history_created | boolean | YES | false |
| portfolio_submitted | boolean | YES | false |
| has_interview | boolean | YES | false |
| has_job_offer | boolean | YES | false |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) |

#### courses
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| school_name | text | NO | '中野坂上'::text |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) |

#### profiles
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| full_name | text | YES |  |
| role_id | text | YES | 'student'::text |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) |

#### roles
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | text | NO |  |
| description | text | YES |  |

#### students
| column | type | nullable | default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| student_id | text | YES | generate_student_id() |
| graduation_date | date | YES |  |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) |
| course_id | uuid | YES |  |

### RLS
- public.activity_logs: 有効
- public.application_attachments: 有効
- public.applications: 有効
- public.courses: 有効
- public.profiles: 有効
- public.roles: 有効
- public.students: 有効

### RLSポリシー
- activity_logs
  - Admins can view activity logs (SELECT) : is_admin()
  - Users can insert own activity logs (INSERT) : user_id = auth.uid()

- application_attachments
  - Admin can view all attachments (SELECT) : is_admin()
  - Student can delete own attachments (DELETE) : application_attachments.application_id 所属が自分
  - Student can insert own attachments (INSERT) : application_attachments.application_id 所属が自分
  - Student can view own attachments (SELECT) : application_attachments.application_id 所属が自分

- applications
  - Admins can manage all applications (ALL) : is_admin()
  - Students can manage own applications (ALL) : student_id = auth.uid()

- courses
  - Public courses are viewable by everyone (SELECT) : true

- profiles
  - Admins can delete all profiles (DELETE) : is_admin()
  - Admins can update all profiles (UPDATE) : is_admin()
  - Admins can view all profiles (SELECT) : is_admin()
  - Users can view own profile (SELECT) : auth.uid() = id

- roles
  - Public roles are viewable by everyone (SELECT) : true

- students
  - Admins can delete all students (DELETE) : is_admin()
  - Admins can update all students (UPDATE) : is_admin()
  - Admins can view all students (SELECT) : is_admin()
  - Students can view own record (SELECT) : auth.uid() = id

### 関数

#### public.is_admin()
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role_id = 'admin'
  );
END;
$function$
```

#### public.generate_student_id()
```sql
CREATE OR REPLACE FUNCTION public.generate_student_id()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$function$
```

#### public.handle_new_user()
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_course_id UUID;
BEGIN
    INSERT INTO public.profiles (id, full_name, role_id)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student');

    v_course_id := (new.raw_user_meta_data->>'course_id')::UUID;

    INSERT INTO public.students (id, course_id)
    VALUES (new.id, v_course_id);

    RETURN new;
END;
$function$
```

### トリガー
- auth.users
  - on_auth_user_created (AFTER INSERT) -> EXECUTE FUNCTION handle_new_user()

---

## Storage

### バケット
- application-attachments
  - public: false
  - file_size_limit: null
  - allowed_mime_types: null

### storage.objects RLS ポリシー
- Admin can select all files (SELECT)
  - bucket_id = 'application-attachments' AND is_admin()
- Student can select own files (SELECT)
  - bucket_id = 'application-attachments' AND storage.foldername(name)[1] が自分の application_id
- Student can upload own files (INSERT)
  - bucket_id = 'application-attachments' AND storage.foldername(name)[1] が自分の application_id
- Student can delete own files (DELETE)
  - bucket_id = 'application-attachments' AND storage.foldername(name)[1] が自分の application_id

---

## 参考（Supabase標準スキーマ）
- auth / storage / realtime / vault / extensions / graphql / supabase_migrations などの標準オブジェクトは省略
