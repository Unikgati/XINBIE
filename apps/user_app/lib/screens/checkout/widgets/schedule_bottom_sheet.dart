import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../../providers/delivery_provider.dart';

class ScheduleBottomSheet extends ConsumerStatefulWidget {
  final DateTime initialDate;
  final DeliverySlot? initialSlot;

  const ScheduleBottomSheet({
    super.key,
    required this.initialDate,
    this.initialSlot,
  });

  @override
  ConsumerState<ScheduleBottomSheet> createState() => _ScheduleBottomSheetState();
}

class _ScheduleBottomSheetState extends ConsumerState<ScheduleBottomSheet> {
  late DateTime _selectedDate;
  DeliverySlot? _selectedSlot;
  late List<DateTime> _availableDates;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.initialDate;
    _selectedSlot = widget.initialSlot;

    final today = DateTime.now();
    _availableDates = List.generate(7, (i) => today.add(Duration(days: i)));
  }

  bool get _isToday => _selectedDate.day == DateTime.now().day && _selectedDate.month == DateTime.now().month && _selectedDate.year == DateTime.now().year;

  @override
  Widget build(BuildContext context) {
    // Reset slot if changing date, unless we want to keep it if it exists.
    final slotsAsync = ref.watch(deliverySlotsProvider(_selectedDate));

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 16),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text('Pilih Tanggal', style: AppTypography.h4.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),

            // Date picker horizontal list
            SizedBox(
              height: 72,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: _availableDates.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final date = _availableDates[index];
                  final isSelected = date.day == _selectedDate.day && date.month == _selectedDate.month && date.year == _selectedDate.year;
                  
                  final days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
                  final dayStr = index == 0 ? 'HARI INI' : days[date.weekday % 7];

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedDate = date;
                        _selectedSlot = null; // Reset slot
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 64,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primaryAction : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            dayStr,
                            style: AppTypography.caption.copyWith(
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: index == 0 ? 10 : 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${date.day}',
                            style: AppTypography.h3.copyWith(
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text('Waktu', style: AppTypography.h4.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),

            // Slots
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: slotsAsync.when(
                  data: (slots) {
                    // Create an Instant pseudo-slot if Today is selected
                    List<DeliverySlot> displaySlots = List.from(slots);
                    
                    if (_isToday) {
                      displaySlots.insert(0, const DeliverySlot(
                        id: 'INSTANT',
                        dayOfWeek: -1,
                        label: 'Instant (Dikirim Segera)',
                        startTime: 'Sekarang',
                        endTime: 'Tiba dalam 1-2 Jam',
                      ));
                    }

                    if (displaySlots.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(child: Text('Tidak ada jadwal pengiriman tersedia.')),
                      );
                    }

                    return Column(
                      children: displaySlots.map((slot) {
                        final isSelected = _selectedSlot?.id == slot.id;
                        final isInstant = slot.id == 'INSTANT';

                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedSlot = slot;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primarySurface : Colors.grey[100],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? AppColors.primaryAction : Colors.transparent,
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        slot.label,
                                        style: AppTypography.labelLarge.copyWith(
                                          color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        isInstant ? slot.endTime : '${slot.startTime} - ${slot.endTime}',
                                        style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => DgShimmer.scheduleSlotList(),
                  error: (e, _) => Center(child: Text('Gagal memuat jadwal: $e')),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: DgButton(
                label: 'Konfirmasi Jadwal',
                onPressed: _selectedSlot == null ? null : () {
                  Navigator.of(context).pop({
                    'date': _selectedDate,
                    'slot': _selectedSlot,
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
