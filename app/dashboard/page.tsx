import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Users, Clock, Trophy } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              modules: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      },
      coursesTeaching: {
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
      },
      progress: true,
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  const isInstructor = user.role === 'INSTRUCTOR'
  const isStudent = user.role === 'STUDENT'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">LMS Platform</span>
          </div>
          <nav className="flex gap-4 items-center">
            <Link href="/courses">
              <Button variant="ghost">Browse Courses</Button>
            </Link>
            {isInstructor && (
              <Link href="/instructor/courses">
                <Button variant="ghost">My Courses</Button>
              </Link>
            )}
            <UserMenu firstName={user.firstName} lastName={user.lastName} />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {isStudent ? 'Continue your learning journey' : 'Manage your courses and students'}
          </p>
        </div>

        {isStudent && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Enrolled Courses
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.enrollments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Lessons
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.progress.filter(p => p.completed).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Courses
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.enrollments.filter(e => e.status === 'ACTIVE').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificates
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.enrollments.filter(e => e.status === 'COMPLETED').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">My Courses</h2>
              {user.enrollments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You haven't enrolled in any courses yet
                    </p>
                    <Link href="/courses">
                      <Button>Browse Courses</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.enrollments.map((enrollment) => {
                    const totalLessons = enrollment.course.modules.reduce(
                      (acc, module) => acc + module.lessons.length,
                      0
                    )
                    const completedLessons = user.progress.filter(
                      p => p.completed && 
                      enrollment.course.modules.some(m => 
                        m.lessons.some(l => l.id === p.lessonId)
                      )
                    ).length
                    const progressPercentage = totalLessons > 0 
                      ? Math.round((completedLessons / totalLessons) * 100)
                      : 0

                    return (
                      <Card key={enrollment.id}>
                        <CardHeader>
                          <CardTitle className="line-clamp-2">
                            {enrollment.course.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                          <Link href={`/courses/${enrollment.course.id}`}>
                            <Button className="w-full">Continue Learning</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {isInstructor && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Courses
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.coursesTeaching.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.coursesTeaching.reduce((acc, course) => acc + course._count.enrollments, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Published Courses
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.coursesTeaching.filter(c => c.status === 'PUBLISHED').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Draft Courses
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.coursesTeaching.filter(c => c.status === 'DRAFT').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Courses</h2>
                <Link href="/instructor/courses/new">
                  <Button>Create New Course</Button>
                </Link>
              </div>
              {user.coursesTeaching.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You haven't created any courses yet
                    </p>
                    <Link href="/instructor/courses/new">
                      <Button>Create Your First Course</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.coursesTeaching.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {course.status} • {course._count.enrollments} students
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {course._count.modules} modules
                        </p>
                        <div className="flex gap-2">
                          <Link href={`/instructor/courses/${course.id}`} className="flex-1">
                            <Button className="w-full" variant="outline">Edit</Button>
                          </Link>
                          <Link href={`/courses/${course.id}`} className="flex-1">
                            <Button className="w-full">View</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}