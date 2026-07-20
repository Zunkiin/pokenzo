'use client'
import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const CONFIRM_SECONDS = 100
const RAID_WINDOW_MINUTES = 20

export default function RaidDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [raid, setRaid] = useState(null)
  const [hostProfile, setHostProfile] = useState(null)
  const [joiners, setJoiners] = useState([])
  const [myJoin, setMyJoin] = useState(null)
  const [givenFeedback, setGivenFeedback] = useState({})
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [raidSecondsLeft, setRaidSecondsLeft] = useState(null)
  const [expiredMsg, setExpiredMsg] = useState('')
  const timerRef = useRef(null)
  const [, forceTick] = useState(0)

  async function loadData() {
    const { data: userData } = await supabaseClient.auth.getUser()
    setUser(userData.user)

    await supabaseClient
      .from('raid_joins')
      .delete()
      .eq('raid_id', params.id)
      .eq('confirmed', false)
      .lt('joined_at', new Date(Date.now() - CONFIRM_SECONDS * 1000).toISOString())

    const { data: raidData } = await supabaseClient
      .from('raids')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (raidData && raidData.invites_sent_at && raidData.status === 'open') {
      const minutesSinceInvites = (Date.now() - new Date(raidData.invites_sent_at).getTime()) / 1000 / 60
      if (minutesSinceInvites >= RAID_WINDOW_MINUTES) {
        await supabaseClient.from('raids').update({ status: 'closed' }).eq('id', raidData.id)
        raidData.status = 'closed'
      }
    }
    setRaid(raidData)

    if (raidData) {
      const { data: host } = await supabaseClient
      .from('profiles')
      .select('username, go_friend_code, go_trainer_name')
      .eq('id', raidData.host_id)
      .maybeSingle()
      setHostProfile(host)

      const { data: joinRows } = await supabaseClient
        .from('raid_joins')
        .select('id, user_id, joined_at, confirmed')
        .eq('raid_id', raidData.id)
        .order('joined_at', { ascending: true })

      const withNames = await Promise.all(
        (joinRows || []).map(async (j) => {
          const { data: p } = await supabaseClient
            .from('profiles')
            .select('username, go_trainer_name')
            .eq('id', j.user_id)
            .maybeSingle()
          return { ...j, username: p?.username || 'Unknown', goTrainerName: p?.go_trainer_name }
        })
      )
      setJoiners(withNames)

      if (userData.user) {
        const mine = withNames.find((j) => j.user_id === userData.user.id)
        setMyJoin(mine || null)
        if (mine && !mine.confirmed) {
          const elapsed = (Date.now() - new Date(mine.joined_at).getTime()) / 1000
          setSecondsLeft(Math.max(0, Math.round(CONFIRM_SECONDS - elapsed)))
        } else {
          setSecondsLeft(null)
        }

        const { data: fbRows } = await supabaseClient
          .from('raid_feedback')
          .select('rated_user_id, went_well')
          .eq('raid_id', raidData.id)
          .eq('user_id', userData.user.id)
        const fbMap = {}
        ;(fbRows || []).forEach((fb) => { fbMap[fb.rated_user_id] = fb.went_well })
        setGivenFeedback(fbMap)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()

    const channel = supabaseClient
      .channel('raid_detail_' + params.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raids', filter: `id=eq.${params.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raid_joins', filter: `raid_id=eq.${params.id}` }, () => loadData())
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [params.id])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          handleExpire()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [secondsLeft === null])

  useEffect(() => {
    if (!raid?.invites_sent_at || raid.status === 'closed') return
    const interval = setInterval(() => {
      const elapsedMin = (Date.now() - new Date(raid.invites_sent_at).getTime()) / 1000 / 60
      const left = Math.max(0, RAID_WINDOW_MINUTES - elapsedMin)
      setRaidSecondsLeft(Math.round(left * 60))
      if (left <= 0) {
        clearInterval(interval)
        loadData()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [raid?.invites_sent_at, raid?.status])

  useEffect(() => {
  const interval = setInterval(() => forceTick((t) => t + 1), 1000)
  return () => clearInterval(interval)
}, [])

  async function handleExpire() {
    if (!myJoin || myJoin.confirmed) return
    await supabaseClient.from('raid_joins').delete().eq('id', myJoin.id)
    setMyJoin(null)
    setExpiredMsg("Time's up - you were removed from this raid since you didn't confirm in time.")
    await loadData()
  }

  async function handleJoin() {
    setJoining(true)
    setJoinError('')
    setExpiredMsg('')
    const { error } = await supabaseClient.from('raid_joins').insert({ raid_id: raid.id, user_id: user.id })
    setJoining(false)
    if (error) {
      if (error.code === '23505') {
        setJoinError('You have already joined this raid.')
      } else {
        setJoinError('This raid may be full or already closed.')
      }
    } else {
      await loadData()
    }
  }

  async function handleConfirmAdded() {
    if (!myJoin) return
    await supabaseClient.from('raid_joins').update({ confirmed: true }).eq('id', myJoin.id)
    clearInterval(timerRef.current)
    setSecondsLeft(null)
    await loadData()
  }

  async function handleSendInvites() {
    await supabaseClient.from('raids').update({ invites_sent_at: new Date().toISOString() }).eq('id', raid.id)
    await loadData()
  }

  async function handleEndRaid() {
    clearInterval(timerRef.current)
    setSecondsLeft(null)
    await supabaseClient.from('raids').update({ status: 'closed' }).eq('id', raid.id)
    await loadData()
  }

  async function rateJoiner(targetUserId, wentWell) {
    const { error } = await supabaseClient
      .from('raid_feedback')
      .upsert(
        { raid_id: raid.id, user_id: user.id, rated_user_id: targetUserId, went_well: wentWell },
        { onConflict: 'raid_id,user_id,rated_user_id' }
      )
    if (!error) {
      setGivenFeedback((prev) => ({ ...prev, [targetUserId]: wentWell }))
    }
  }

  async function handleFinishAndRateAll() {
    const noShows = joiners.filter((j) => !j.confirmed)
    for (const j of noShows) {
      await rateJoiner(j.user_id, false)
    }
    await handleEndRaid()
  }

  function copyAllNames() {
    const names = joiners.map((j) => j.username).join('\n')
    navigator.clipboard.writeText(names)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!raid) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Raid not found.</p>
      </main>
    )
  }

  const isHost = user && user.id === raid.host_id
  const joinCount = joiners.length
  const isFull = joinCount >= raid.max_joiners
  const isClosed = raid.status === 'closed'
  const canSeeJoinerList = isHost || myJoin
  const invitesSent = !!raid.invites_sent_at

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/t/pokemon-go/raids" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back to raids</span>
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <div className="flex items-center gap-3 mb-3">
            {raid.boss_image_url && (
              <img src={raid.boss_image_url} alt={raid.boss} className="w-16 h-16 object-contain" />
            )}
            <div>
              <p className="text-xs text-[#8A8C9C]">
                Hosted by {hostProfile?.username}{hostProfile?.go_trainer_name && ` (${hostProfile.go_trainer_name})`}
                {(isHost || myJoin) && hostProfile?.go_friend_code && (
                  <span className="ml-2 font-mono font-semibold text-[#4FA8A0]">· {hostProfile.go_friend_code}</span>
                )}
              </p>
              <p className="text-lg font-semibold text-[#E8A33D]">{raid.boss}</p>
            </div>
          </div>
          <p className="text-sm text-[#C7C9D9]">{joinCount} / {raid.max_joiners} joined</p>
          {invitesSent && !isClosed && raidSecondsLeft !== null && (
            <p className="text-xs text-[#E8A33D] mt-2">
              Raid in progress - room closes in {Math.floor(raidSecondsLeft / 60)}:{String(raidSecondsLeft % 60).padStart(2, '0')}
            </p>
          )}
          {isClosed && <p className="text-xs text-[#C1554A] mt-2">This raid has been closed.</p>}
        </div>

        {myJoin && !myJoin.confirmed && !isHost && (
          <div className="rounded-xl border border-[#E8A33D] bg-[#E8A33D]/10 p-4">
            <p className="text-sm font-semibold mb-1">Add {hostProfile?.username} in Pokémon GO now!</p>
            {hostProfile?.go_friend_code && (
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-mono font-semibold bg-[#14151F] border border-[#2A2C3D] rounded-lg px-3 py-2 inline-block">
                  {hostProfile.go_friend_code}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(hostProfile.go_friend_code)}
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3] hover:bg-[#3A3D57]"
                >
                  Copy
                </button>
              </div>
            )}
            <p className="text-xs text-[#C7C9D9] mb-3">You have {secondsLeft ?? CONFIRM_SECONDS} seconds to confirm, or you'll be removed to free up the spot.</p>
            <button onClick={handleConfirmAdded} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F]">
              I've added them ✓
            </button>
          </div>
        )}

        {expiredMsg && (
          <div className="rounded-xl border border-[#C1554A] bg-[#C1554A]/10 p-4">
            <p className="text-sm text-[#C1554A]">{expiredMsg}</p>
          </div>
        )}

        {!isHost && !myJoin && !expiredMsg && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            {!user ? (
              <p className="text-sm text-[#8A8C9C]">
                <Link href="/t/pokemon-go" className="text-[#E8A33D] hover:underline">Log in</Link> to join this raid.
              </p>
            ) : isClosed ? (
              <p className="text-sm text-[#8A8C9C]">This raid is no longer accepting joiners.</p>
            ) : isFull ? (
              <p className="text-sm text-[#8A8C9C]">This raid room is full.</p>
            ) : (
              <>
                <button onClick={handleJoin} disabled={joining} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F] disabled:opacity-50">
                  {joining ? 'Joining...' : 'Join raid'}
                </button>
                {joinError && <p className="text-xs text-[#C1554A] mt-2">{joinError}</p>}
              </>
            )}
          </div>
        )}

        {canSeeJoinerList && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-3">Joined trainers</h2>
            {joiners.length === 0 ? (
              <p className="text-sm text-[#8A8C9C]">No one has joined yet.</p>
            ) : (
              <div className="space-y-1 mb-3">
                {joiners.map((j) => {
                  const elapsed = (Date.now() - new Date(j.joined_at).getTime()) / 1000
                  const remaining = Math.max(0, Math.round(CONFIRM_SECONDS - elapsed))
                  const rating = givenFeedback[j.user_id]
                  return (
                    <div key={j.id} className="flex items-center justify-between text-sm bg-[#14151F] rounded-lg px-3 py-2">
                      <div>
                        <span className="text-[#C7C9D9]">
                          {j.username}
                          {j.goTrainerName && <span className="text-[#8A8C9C] text-xs"> ({j.goTrainerName})</span>}
                        </span>
                        <span className={'ml-2 text-xs ' + (j.confirmed ? 'text-[#4FA8A0]' : 'text-[#8A8C9C]')}>
                          {j.confirmed ? '✓ Confirmed' : `${remaining}s left`}
                        </span>
                      </div>
                      {isHost && invitesSent && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => rateJoiner(j.user_id, true)}
                            className={'text-xs px-2 py-1 rounded ' + (rating === true ? 'bg-[#4FA8A0] text-[#14151F]' : 'bg-[#2A2C3D] text-[#8A8C9C]')}
                          >
                            👍
                          </button>
                          <button
                            onClick={() => rateJoiner(j.user_id, false)}
                            className={'text-xs px-2 py-1 rounded ' + (rating === false ? 'bg-[#C1554A] text-[#14151F]' : 'bg-[#2A2C3D] text-[#8A8C9C]')}
                          >
                            👎
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {isHost && joiners.length > 0 && (
              <button onClick={copyAllNames} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC]">
                Copy all trainer names
              </button>
            )}
          </div>
        )}

        {isHost && !isClosed && !invitesSent && (
          <button onClick={handleSendInvites} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
            Raid invites sent
          </button>
        )}

        {isHost && !isClosed && invitesSent && (
          <button onClick={handleFinishAndRateAll} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F]">
            Finish raid
          </button>
        )}

        {isHost && !isClosed && (
          <button onClick={handleEndRaid} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#C1554A] text-[#14151F]">
            End raid
          </button>
        )}

        {invitesSent && myJoin && !isHost && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-2">How did the raid go?</h2>
            {givenFeedback[raid.host_id] !== undefined ? (
              <p className="text-sm text-[#4FA8A0]">
                You rated this raid {givenFeedback[raid.host_id] ? 'thumbs up 👍' : 'thumbs down 👎'}. Thanks!
              </p>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => rateJoiner(raid.host_id, true)} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F]">
                  👍 Good
                </button>
                <button onClick={() => rateJoiner(raid.host_id, false)} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#C1554A] text-[#14151F]">
                  👎 Bad
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}