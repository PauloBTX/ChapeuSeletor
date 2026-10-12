import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const ChapeuSeletorApp());
}

class ChapeuSeletorApp extends StatelessWidget {
  const ChapeuSeletorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'O Chapéu Seletor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF07050D),
      ),
      home: const ChapeuSeletorScreen(),
    );
  }
}

class ChapeuSeletorScreen extends StatefulWidget {
  const ChapeuSeletorScreen({super.key});

  @override
  State<ChapeuSeletorScreen> createState() => _ChapeuSeletorScreenState();
}

class _ChapeuSeletorScreenState extends State<ChapeuSeletorScreen>
    with SingleTickerProviderStateMixin {
  late AudioPlayer _player;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  bool _isPlaying = false;
  int _currentIndex = -1;
  int _sortedCount = 0;
  String _currentStepTitle = "Aguardando Início";
  String _currentStepMessage = "Aproxime-se e coloque o Chapéu Seletor...";

  final Random _rng = Random();

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();

    // Pulse animation for the Available button state
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.98, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Listen to track index changes for step messages
    _player.currentIndexStream.listen((index) {
      if (index != null && _isPlaying) {
        setState(() {
          _currentIndex = index;
          _updateStepInfo(index);
        });
      }
    });

    // Listen to playback state to automatically return to Available state
    _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed && _isPlaying) {
        _onCeremonyCompleted();
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _player.dispose();
    WakelockPlus.disable();
    super.dispose();
  }

  void _updateStepInfo(int index) {
    HapticFeedback.lightImpact();
    switch (index) {
      case 0:
        _currentStepTitle = "Etapa 1 de 5: Abertura";
        _currentStepMessage = "O Chapéu Seletor examina sua mente...";
        break;
      case 1:
        _currentStepTitle = "Etapa 2 de 5: Primeiro Julgamento";
        _currentStepMessage = "Pesando suas virtudes, coragem e intelecto...";
        break;
      case 2:
        _currentStepTitle = "Etapa 3 de 5: Segundo Julgamento";
        _currentStepMessage = "Enxergando a lealdade e astúcia no seu coração...";
        break;
      case 3:
        _currentStepTitle = "Etapa 4 de 5: Decisão do Destino";
        _currentStepMessage = "A escolha final está quase selada...";
        break;
      case 4:
        _currentStepTitle = "Etapa 5 de 5: A Casa Escolhida";
        _currentStepMessage = "✨ A CASA FOI PROCLAMADA! ✨";
        HapticFeedback.heavyImpact();
        break;
    }
  }

  // Lists of actual available audio files
  static const List<String> _aberturas = [
    'aberturas (1).wav', 'aberturas (2).wav', 'aberturas (3).wav', 'aberturas (4).wav',
    'aberturas (5).wav', 'aberturas (6).wav', 'aberturas (7).wav', 'aberturas (8).wav',
    'aberturas (9).wav', 'aberturas (10).wav', 'aberturas (11).wav', 'aberturas (12).wav',
    'aberturas (13).wav', 'aberturas (14).wav', 'aberturas (15).wav', 'aberturas (16).wav',
    'aberturas (17).wav', 'aberturas (18).wav', 'aberturas (19).wav'
  ];

  static const List<String> _transicoes = [
    'transicao-casa (1).wav', 'transicao-casa (2).wav', 'transicao-casa (3).wav',
    'transicao-casa (4).wav', 'transicao-casa (5).wav', 'transicao-casa (6).wav',
    'transicao-casa (7).wav', 'transicao-casa (8).wav', 'transicao-casa (9).wav',
    'transicao-casa (10).wav', 'transicao-casa (11).wav', 'transicao-casa (12).wav',
    'transicao-casa (13).wav', 'transicao-casa (14).wav', 'transicao-casa (15).wav'
  ];

  static const List<String> _escolhas = [
    'escolha-casa (1).wav', 'escolha-casa (3).wav', 'escolha-casa (4).wav',
    'escolha-casa (5).wav', 'escolha-casa (6).wav', 'escolha-casa (7).wav',
    'escolha-grifinoria (1).wav', 'escolha-grifinoria (2).wav',
    'escolha-sonserina (1).wav', 'escolha-sonserina (2).wav',
    'escolha-corvinal (1).wav', 'escolha-corvinal (2).wav',
    'escolha-lufalufa (1).wav', 'escolha-lufalufa (2).wav'
  ];

  /// Builds the 5-item gapless ConcatenatingAudioSource
  ConcatenatingAudioSource _buildSortingPlaylist() {
    final abertura = _aberturas[_rng.nextInt(_aberturas.length)];
    
    // Pick 2 distinct adjetivos
    final adjNum1 = _rng.nextInt(92) + 1; // adjetivos (1) or (48..138)
    final adjFile1 = adjNum1 == 1 ? 'adjetivos (1).wav' : 'adjetivos (${adjNum1 + 46}).wav';
    int adjNum2 = _rng.nextInt(92) + 1;
    while (adjNum2 == adjNum1) {
      adjNum2 = _rng.nextInt(92) + 1;
    }
    final adjFile2 = adjNum2 == 1 ? 'adjetivos (1).wav' : 'adjetivos (${adjNum2 + 46}).wav';

    final transicao = _transicoes[_rng.nextInt(_transicoes.length)];
    final escolha = _escolhas[_rng.nextInt(_escolhas.length)];

    return ConcatenatingAudioSource(
      useLazyPreparation: false, // Preloads tracks ahead of time for true gapless playback!
      children: [
        AudioSource.asset('assets/$abertura'),
        AudioSource.asset('assets/$adjFile1'),
        AudioSource.asset('assets/$adjFile2'),
        AudioSource.asset('assets/$transicao'),
        AudioSource.asset('assets/$escolha'),
      ],
    );
  }

  Future<void> _startCeremony() async {
    if (_isPlaying) return;

    setState(() {
      _isPlaying = true;
      _currentIndex = 0;
      _currentStepTitle = "Iniciando Cerimônia...";
      _currentStepMessage = "Preparando a mente para a seleção...";
    });

    try {
      // Keep screen on during sorting
      await WakelockPlus.enable();
      await HapticFeedback.mediumImpact();

      final playlist = _buildSortingPlaylist();
      await _player.setAudioSource(playlist, initialIndex: 0, initialPosition: Duration.zero);
      await _player.play();
    } catch (e) {
      debugPrint("Erro ao reproduzir áudios: $e");
      _resetCeremony();
    }
  }

  void _onCeremonyCompleted() {
    setState(() {
      _sortedCount++;
      _currentStepTitle = "Seleção Concluída!";
      _currentStepMessage = "Uma nova jornada mágica se inicia em Hogwarts!";
    });

    // Wait a brief celebratory moment, then restore the button for the next child
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) {
        _resetCeremony();
      }
    });
  }

  void _resetCeremony() {
    WakelockPlus.disable();
    _player.stop();
    setState(() {
      _isPlaying = false;
      _currentIndex = -1;
      _currentStepTitle = "Pronto para a Próxima Criança";
      _currentStepMessage = "Aproxime-se e coloque o Chapéu Seletor...";
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.4),
            radius: 1.2,
            colors: [
              Color(0xFF231438),
              Color(0xFF0F0A1C),
              Color(0xFF07050D),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF161122).withOpacity(0.7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Text("⚡ ", style: TextStyle(color: Color(0xFFFBE38E))),
                          Text(
                            "Crianças Selecionadas: $_sortedCount",
                            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFDEC891)),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, color: Color(0xFFDEC891)),
                      tooltip: "Reiniciar",
                      onPressed: _isPlaying ? _resetCeremony : null,
                    ),
                  ],
                ),

                // Center Stage: Title, Hat & Status
                Column(
                  children: [
                    Text(
                      "O CHAPÉU SELETOR",
                      style: GoogleFonts.cinzel(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 3,
                        color: const Color(0xFFFBE38E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Cerimônia de Seleção de Hogwarts",
                      style: GoogleFonts.cormorantGaramond(
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                        color: const Color(0xFFBFA980),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Hat Icon / Graphic
                    Container(
                      height: size.height * 0.22,
                      alignment: Alignment.center,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFD4AF37).withOpacity(_isPlaying ? 0.45 : 0.15),
                                  blurRadius: 40,
                                  spreadRadius: 10,
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.auto_awesome,
                            size: 110,
                            color: _isPlaying ? const Color(0xFFFBE38E) : const Color(0xFF8C6D1F),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Status Card with 5-dot Progress
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF120E1C).withOpacity(0.85),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.25)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            _currentStepTitle.toUpperCase(),
                            style: GoogleFonts.cinzel(
                              fontSize: 11,
                              letterSpacing: 2,
                              color: const Color(0xFFFBE38E),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _currentStepMessage,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 17,
                              color: const Color(0xFFF7EED9),
                            ),
                          ),
                          const SizedBox(height: 10),

                          // 5 Progress Dots
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(5, (i) {
                              final isCurrent = i == _currentIndex && _isPlaying;
                              final isDone = i < _currentIndex;
                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                margin: const EdgeInsets.symmetric(horizontal: 5),
                                width: isCurrent ? 12 : 8,
                                height: isCurrent ? 12 : 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isCurrent
                                      ? const Color(0xFFFBE38E)
                                      : (isDone ? const Color(0xFF8C6D1F) : Colors.white12),
                                  boxShadow: isCurrent
                                      ? [
                                          const BoxShadow(
                                            color: Color(0xFFD4AF37),
                                            blurRadius: 10,
                                            spreadRadius: 2,
                                          )
                                        ]
                                      : null,
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Central Action Zone: 1 Single Large Button
                Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _isPlaying ? 1.0 : _pulseAnimation.value,
                        child: child,
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(40),
                        boxShadow: [
                          BoxShadow(
                            color: _isPlaying
                                ? Colors.black54
                                : const Color(0xFFD4AF37).withOpacity(0.35),
                            blurRadius: _isPlaying ? 15 : 28,
                            spreadRadius: _isPlaying ? 1 : 4,
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isPlaying
                              ? const Color(0xFF150F1D)
                              : const Color(0xFF1F162C),
                          foregroundColor: const Color(0xFFFBE38E),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(40),
                            side: BorderSide(
                              color: _isPlaying
                                  ? const Color(0xFFD4AF37).withOpacity(0.2)
                                  : const Color(0xFFD4AF37).withOpacity(0.65),
                              width: 1.5,
                            ),
                          ),
                          elevation: 0,
                        ),
                        onPressed: _isPlaying ? null : _startCeremony,
                        child: _isPlaying
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFBE38E)),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    "SELEÇÃO EM CURSO...",
                                    style: GoogleFonts.cinzel(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 2,
                                      color: const Color(0xFFDEC891),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Text("⚡ ", style: TextStyle(fontSize: 18)),
                                      Text(
                                        "COLOCAR O CHAPÉU",
                                        style: GoogleFonts.cinzel(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 2,
                                          color: const Color(0xFFFBE38E),
                                        ),
                                      ),
                                      const Text(" ⚡", style: TextStyle(fontSize: 18)),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "Toque para iniciar o sorteio",
                                    style: GoogleFonts.cormorantGaramond(
                                      fontSize: 13,
                                      color: const Color(0xFFBFA980),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
