import type { AudioEvent } from './AudioEngine';

export class EventQueue {
  private events: AudioEvent[] = [];
  private halfLife = 1.5; // seconds
  private clusterWindow = 0.03; // 30ms clustering window

  constructor(halfLife: number = 1.5) {
    this.halfLife = halfLife;
  }

  push(event: AudioEvent): void {
    // Cluster nearby events
    const clusteredEvent = this.clusterEvent(event);
    if (clusteredEvent) {
      this.events.push(clusteredEvent);
    }
  }

  popSince(t0: number, t1: number): AudioEvent[] {
    const relevantEvents: AudioEvent[] = [];
    const remainingEvents: AudioEvent[] = [];

    for (const event of this.events) {
      if (event.t >= t0 && event.t <= t1) {
        relevantEvents.push(event);
      } else if (event.t > t1) {
        remainingEvents.push(event);
      }
      // Events before t0 are discarded (older than window)
    }

    this.events = remainingEvents;
    return relevantEvents;
  }

  private clusterEvent(newEvent: AudioEvent): AudioEvent | null {
    // Find events within cluster window
    const clusterStart = newEvent.t - this.clusterWindow;
    const clusterEnd = newEvent.t + this.clusterWindow;
    
    const clusteredEvents: AudioEvent[] = [];
    const remainingEvents: AudioEvent[] = [];

    for (const event of this.events) {
      if (event.t >= clusterStart && event.t <= clusterEnd) {
        clusteredEvents.push(event);
      } else {
        remainingEvents.push(event);
      }
    }

    if (clusteredEvents.length === 0) {
      // No clustering needed
      this.events = remainingEvents;
      return newEvent;
    }

    // Combine clustered events
    clusteredEvents.push(newEvent);
    
    // Calculate combined energy and average properties
    let totalEnergy = 0;
    let weightedPitch = 0;
    let weightedCentroid = 0;
    let pitchWeight = 0;
    let centroidWeight = 0;

    for (const event of clusteredEvents) {
      totalEnergy += event.energy;
      
      if (event.pitch !== undefined) {
        weightedPitch += event.pitch * event.energy;
        pitchWeight += event.energy;
      }
      
      if (event.centroid !== undefined) {
        weightedCentroid += event.centroid * event.energy;
        centroidWeight += event.energy;
      }
    }

    const combinedEvent: AudioEvent = {
      t: newEvent.t, // Use the latest event's time
      band: newEvent.band, // Use the latest event's band
      energy: Math.min(totalEnergy, 1.0), // Cap at 1.0
      pitch: pitchWeight > 0 ? weightedPitch / pitchWeight : undefined,
      centroid: centroidWeight > 0 ? weightedCentroid / centroidWeight : undefined
    };

    this.events = remainingEvents;
    return combinedEvent;
  }

  // Get memory value based on half-life decay
  getMemoryValue(currentTime: number): number {
    let memory = 0;
    
    for (const event of this.events) {
      const age = currentTime - event.t;
      if (age >= 0) {
        const decay = Math.exp(-age / this.halfLife);
        memory += event.energy * decay;
      }
    }
    
    return Math.min(memory, 1.0);
  }

  // Get events for specific band
  getBandEvents(band: 'low'|'mid'|'high'|'full', currentTime: number): AudioEvent[] {
    return this.events.filter(event => 
      event.band === band && 
      (currentTime - event.t) < this.halfLife * 3 // Keep events for 3 half-lives
    );
  }

  // Clear old events
  cleanup(currentTime: number): void {
    const cutoffTime = currentTime - this.halfLife * 3;
    this.events = this.events.filter(event => event.t > cutoffTime);
  }

  // Get current event count
  getEventCount(): number {
    return this.events.length;
  }

  // Set half-life
  setHalfLife(halfLife: number): void {
    this.halfLife = halfLife;
  }
}
