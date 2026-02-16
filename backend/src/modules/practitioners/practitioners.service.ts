import prisma from '../../config/database'
import { AppointmentStatus, DayOfWeek } from '@prisma/client'
import type {
  PractitionerSearchFilters,
  PractitionerSearchResult,
  PractitionerDetailResponse,
  AvailableSlot,
} from './practitioners.types'

export class PractitionersService {
  async searchPractitioners(
    filters: PractitionerSearchFilters & { page?: number; limit?: number },
  ) {
    const {
      search,
      specialtyId,
      city,
      teleconsultationEnabled,
      availableToday,
      minPrice,
      maxPrice,
      minRating,
      acceptsInsurance,
      latitude,
      longitude,
      radiusKm,
      page = 1,
      limit = 20,
    } = filters

    const skip = (page - 1) * limit

    const where: any = {
      user: {
        status: 'ACTIVE',
      },
      acceptsNewPatients: true,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { clinicName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (specialtyId) {
      where.specialties = {
        some: {
          specialtyId,
        },
      }
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (teleconsultationEnabled !== undefined) {
      where.teleconsultationEnabled = teleconsultationEnabled
    }

    if (acceptsInsurance !== undefined) {
      where.acceptsInsurance = acceptsInsurance
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.baseConsultationFee = {}
      if (minPrice !== undefined) {
        where.baseConsultationFee.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.baseConsultationFee.lte = maxPrice
      }
    }

    if (minRating !== undefined) {
      where.averageRating = {
        gte: minRating,
      }
    }

    const practitioners = await prisma.practitioner.findMany({
      where,
      skip,
      take: limit,
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        user: {
          select: {
            status: true,
          },
        },
      },
      orderBy: [{ averageRating: 'desc' }, { totalReviews: 'desc' }],
    })

    // get total count for pagination
    const total = await prisma.practitioner.count({ where })

    // geolocation filter if provided
    let filteredPractitioners = practitioners
    if (latitude && longitude && radiusKm) {
      filteredPractitioners = practitioners.filter((p) => {
        if (!p.latitude || !p.longitude) return false
        const distance = this.calculateDistance(
          latitude,
          longitude,
          p.latitude,
          p.longitude,
        )
        return distance <= radiusKm
      })
    }

    // check availability if need
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results: PractitionerSearchResult[] = await Promise.all(
      filteredPractitioners.map(async (p) => {
        let availableToday_result = false
        let nextAvailableSlot = null

        if (availableToday !== undefined) {
          const slots = await this.getAvailableSlotsForDate(p.id, today)
          availableToday_result = slots.length > 0
          if (availableToday_result && slots.length > 0) {
            nextAvailableSlot = slots[0]
          }
        }

        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          title: p.title,
          phone: p.phone,
          bio: p.bio,
          clinicName: p.clinicName,
          address: p.address,
          city: p.city,
          latitude: p.latitude,
          longitude: p.longitude,
          baseConsultationFee: Number(p.baseConsultationFee),
          teleconsultationFee: p.teleconsultationFee
            ? Number(p.teleconsultationFee)
            : null,
          teleconsultationEnabled: p.teleconsultationEnabled,
          averageRating: p.averageRating ? Number(p.averageRating) : null,
          totalReviews: p.totalReviews,
          acceptsInsurance: p.acceptsInsurance,
          acceptsNewPatients: p.acceptsNewPatients,
          specialties: p.specialties.map((ps) => ({
            id: ps.specialty.id,
            name: ps.specialty.name,
            isPrimary: ps.isPrimary,
          })),
          availableToday: availableToday_result,
          nextAvailableSlot,
        }
      }),
    )

    const finalResults =
      availableToday !== undefined
        ? results.filter((r) => r.availableToday === availableToday)
        : results

    return {
      data: finalResults,
      total: availableToday !== undefined ? finalResults.length : total,
      page,
      limit,
      totalPages: Math.ceil(
        (availableToday !== undefined ? finalResults.length : total) / limit,
      ),
    }
  }

  async getPractitionerById(
    id: string,
  ): Promise<PractitionerDetailResponse | null> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        qualifications: {
          where: {
            isVerified: true,
          },
          select: {
            id: true,
            title: true,
            institution: true,
            yearObtained: true,
          },
        },
        user: {
          select: {
            status: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!practitioner) {
      return null
    }

    // temp empty arrays for languages and photos : to add in schema later
    return {
      id: practitioner.id,
      firstName: practitioner.firstName,
      lastName: practitioner.lastName,
      title: practitioner.title,
      phone: practitioner.phone,
      bio: practitioner.bio,
      clinicName: practitioner.clinicName,
      address: practitioner.address,
      city: practitioner.city,
      latitude: practitioner.latitude,
      longitude: practitioner.longitude,
      baseConsultationFee: Number(practitioner.baseConsultationFee),
      teleconsultationFee: practitioner.teleconsultationFee
        ? Number(practitioner.teleconsultationFee)
        : null,
      teleconsultationEnabled: practitioner.teleconsultationEnabled,
      averageRating: practitioner.averageRating
        ? Number(practitioner.averageRating)
        : null,
      totalReviews: practitioner.totalReviews,
      acceptsInsurance: practitioner.acceptsInsurance,
      acceptsNewPatients: practitioner.acceptsNewPatients,
      licenseNumber: practitioner.licenseNumber,
      licenseVerified: practitioner.licenseVerified,
      yearsOfExperience: practitioner.yearsOfExperience,
      consultationDuration: practitioner.consultationDuration,
      specialties: practitioner.specialties.map((ps) => ({
        id: ps.specialty.id,
        name: ps.specialty.name,
        isPrimary: ps.isPrimary,
      })),
      qualifications: practitioner.qualifications.map((q) => ({
        id: q.id,
        degree: q.title,
        institution: q.institution,
        yearObtained: q.yearObtained,
      })),
      languages: [], // todo: add languages field to schema
      photos: [], // todo: add photos  to schema
    }
  }

  //available time slots for a practitioner
  async getAvailableSlots(
    practitionerId: string,
    startDate?: Date,
    endDate?: Date,
    days = 7,
  ): Promise<AvailableSlot[]> {
    // fetch practitioner settings for slot generation rules
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: {
        consultationDuration: true,
        backToBack: true,
        breakBetweenSlots: true,
        minBookingNotice: true,
        maxBookingAdvance: true,
        acceptsNewPatients: true,
      },
    })

    const slotDuration = practitioner?.consultationDuration ?? 30
    const breakBetween =
      practitioner && !practitioner.backToBack
        ? practitioner.breakBetweenSlots
        : 0
    const minBookingNotice = practitioner?.minBookingNotice ?? 60 // minutes
    const maxBookingAdvance = practitioner?.maxBookingAdvance ?? 60 // days

    const now = new Date()
    const start = startDate || new Date()
    start.setHours(0, 0, 0, 0)

    // cap end date to maxBookingAdvance days from now
    const maxEnd = new Date(now)
    maxEnd.setDate(maxEnd.getDate() + maxBookingAdvance)
    maxEnd.setHours(23, 59, 59, 999)

    let end = endDate || new Date(start)
    if (!endDate) {
      end.setDate(end.getDate() + days)
    }
    // enforce maxBookingAdvance
    if (end > maxEnd) {
      end = maxEnd
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        practitionerId,
        isActive: true,
      },
    })

    // get practitioners absences
    const absences = await prisma.absence.findMany({
      where: {
        practitionerId,
        OR: [
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
          },
        ],
      },
    })

    // get blocked slots
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        practitionerId,
        date: {
          gte: start,
          lte: end,
        },
      },
    })

    // get existing appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        appointmentDate: true,
        startTime: true,
        endTime: true,
      },
    })

    // earliest bookable time = now + minBookingNotice
    const earliestBookable = new Date(
      now.getTime() + minBookingNotice * 60 * 1000,
    )

    const result: AvailableSlot[] = []
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const dayOfWeek = this.getDayOfWeek(currentDate)
      const dateStr = this.formatDateLocal(currentDate)

      // check if practitioner is absent on this date
      const isAbsent = absences.some(
        (a) => currentDate >= a.startDate && currentDate <= a.endDate,
      )

      if (!isAbsent) {
        const dayAvailabilities = availabilities.filter(
          (a) => a.dayOfWeek === dayOfWeek,
        )

        // get blocked slots for this date
        const dayBlockedSlots = blockedSlots.filter(
          (b) => this.formatDateLocal(b.date) === dateStr,
        )

        const slots: string[] = []

        for (const availability of dayAvailabilities) {
          // use practitioner's consultationDuration, with availability breakBetween gap
          const timeSlots = this.generateTimeSlots(
            availability.startTime,
            availability.endTime,
            slotDuration,
            availability.breakStartTime,
            availability.breakEndTime,
            breakBetween,
          )

          // filter booked slots, blocked slots, and respect minBookingNotice
          const availableSlots = timeSlots.filter((slot) => {
            // check if slot is booked
            const isBooked = appointments.some(
              (apt) =>
                this.formatDateLocal(apt.appointmentDate) === dateStr &&
                apt.startTime === slot,
            )
            if (isBooked) return false

            // check if slot overlaps a blocked slot
            const [slotH, slotM] = slot.split(':').map(Number)
            const slotStartMin = slotH * 60 + slotM
            const slotEndMin = slotStartMin + slotDuration

            const isBlocked = dayBlockedSlots.some((b) => {
              const [bsH, bsM] = b.startTime.split(':').map(Number)
              const [beH, beM] = b.endTime.split(':').map(Number)
              const blockStart = bsH * 60 + bsM
              const blockEnd = beH * 60 + beM
              return slotStartMin < blockEnd && slotEndMin > blockStart
            })
            if (isBlocked) return false

            // check minBookingNotice: slot must be after earliest bookable time
            const slotDateTime = new Date(currentDate)
            slotDateTime.setHours(slotH, slotM, 0, 0)
            if (slotDateTime < earliestBookable) return false

            return true
          })

          slots.push(...availableSlots)
        }

        if (slots.length > 0) {
          result.push({
            date: dateStr,
            slots: slots.sort(),
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return result
  }

  // helper get available slots for a specific date
  private async getAvailableSlotsForDate(
    practitionerId: string,
    date: Date,
  ): Promise<string[]> {
    const dayOfWeek = this.getDayOfWeek(date)
    const dateStr = this.formatDateLocal(date)

    const isAbsent = await prisma.absence.findFirst({
      where: {
        practitionerId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    })

    if (isAbsent) {
      return []
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        practitionerId,
        dayOfWeek,
        isActive: true,
      },
    })

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        appointmentDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
      },
    })

    const bookedSlots = appointments.map((a) => a.startTime)
    const slots: string[] = []

    for (const availability of availabilities) {
      const timeSlots = this.generateTimeSlots(
        availability.startTime,
        availability.endTime,
        availability.slotDuration,
        availability.breakStartTime,
        availability.breakEndTime,
      )

      const availableSlots = timeSlots.filter(
        (slot) => !bookedSlots.includes(slot),
      )

      slots.push(...availableSlots)
    }

    return slots.sort()
  }

  // helper generate time slots
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    breakStart?: string | null,
    breakEnd?: string | null,
    breakBetween = 0,
  ): string[] {
    const slots: string[] = []
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    let currentMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    let breakStartMinutes: number | null = null
    let breakEndMinutes: number | null = null

    if (breakStart && breakEnd) {
      const [bsHour, bsMinute] = breakStart.split(':').map(Number)
      const [beHour, beMinute] = breakEnd.split(':').map(Number)
      breakStartMinutes = bsHour * 60 + bsMinute
      breakEndMinutes = beHour * 60 + beMinute
    }

    while (currentMinutes + duration <= endMinutes) {
      // check if slot is during break time
      const isBreak =
        breakStartMinutes !== null &&
        breakEndMinutes !== null &&
        currentMinutes >= breakStartMinutes &&
        currentMinutes < breakEndMinutes

      if (!isBreak) {
        const hour = Math.floor(currentMinutes / 60)
        const minute = currentMinutes % 60
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
        slots.push(timeStr)
        // advance by duration + break between appointments
        currentMinutes += duration + breakBetween
      } else {
        // if in break, skip to break end
        if (breakEndMinutes !== null) {
          currentMinutes = breakEndMinutes
        } else {
          currentMinutes += duration
        }
      }
    }

    return slots
  }

  // helper get day of week
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]
    return days[date.getDay()]
  }

  // format date as local YYYY-MM-DD (timezone safe, no UTC shit)
  private formatDateLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // calculate distance between two coordinates (haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371 // earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // helper convert degrees to radians
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }
}

export const practitionersService = new PractitionersService()
